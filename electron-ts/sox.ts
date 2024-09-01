// This code is a simplified and typed version adapted from the 'node-record-lpcm16' project by Gilles De Mey.
// Original source code: https://github.com/gillesdemey/node-record-lpcm16

import { ok as assert } from 'assert';
import { ChildProcess, spawn } from 'child_process';
import { Subject } from 'rxjs';
import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

export type SoxRecordingOptions = {
  binDir: string;
  sampleRate: number;
  channels: number;
  compress: boolean;
  threshold: number;
  silence: string;
  endOnSilence: boolean;
  audioType: string;
};

export class SoxRecording {
  debug$ = new Subject<string>();

  private options: SoxRecordingOptions;

  private process: ChildProcess | undefined;

  private soxStream: Readable | null | undefined;

  constructor(options = {}) {
    const defaults = {
      binDir: 'resources\\bin',
      sampleRate: 16000,
      channels: 1,
      compress: false,
      threshold: 0.5,
      silence: '1.0',
      recorder: 'sox',
      endOnSilence: false,
      audioType: 'wav',
    };

    this.options = Object.assign(defaults, options);

    this.debug$.next('Started recording');
    this.debug$.next(JSON.stringify(this.options));

    this.start();
  }

  start() {
    const cmd =  `${this.options.binDir}\\sox`;
    const args = [
      '--default-device',
      '--no-show-progress', // show no progress
      '--rate',
      this.options.sampleRate.toString(), // sample rate
      '--channels',
      this.options.channels.toString(), // channels
      '--encoding',
      'signed-integer', // sample encoding
      '--bits',
      '16', // precision (bits)
      '--type',
      this.options.audioType, // audio type
      '-', // pipe
    ];
    this.debug$.next(` ${cmd} ${args.join(' ')}`);

    const cp = spawn(cmd, args, {
      stdio: 'pipe',
    });
    const rec = cp.stdout;
    const err = cp.stderr;

    this.process = cp; // expose child process
    this.soxStream = cp.stdout; // expose output stream

    cp.on('close', (code) => {
      if (code === 0) return;
      rec?.emit(
        'error',
        `${cmd} has exited with error code ${code}.

Enable debugging with the environment variable debug=record.`,
      );
    });

    err?.on('data', (chunk) => {
      this.debug$.next(`STDERR: ${chunk}`);
    });

    rec?.on('data', (chunk) => {
      this.debug$.next(`Recording ${chunk.length} bytes`);
    });

    rec?.on('end', () => {
      this.debug$.next('Recording ended');
    });

    return this;
  }

  stop() {
    assert(this.process, 'Recording not yet started');
    this.process.kill();
  }

  pause() {
    assert(this.process, 'Recording not yet started');

    this.process.kill('SIGSTOP');
    this.soxStream?.pause();
    this.debug$.next('Paused recording');
  }

  resume() {
    assert(this.process, 'Recording not yet started');

    this.process.kill('SIGCONT');
    this.soxStream?.resume();
    this.debug$.next('Resumed recording');
  }

  isPaused() {
    assert(this.process, 'Recording not yet started');

    return this.soxStream?.isPaused();
  }

  stream(): ReadableStream<Buffer> {
    assert(this?.soxStream, 'Recording not yet started');
    return Readable.toWeb(this?.soxStream);
  }
}
