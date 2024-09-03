# Welcome to the Lecture model app





## How it works

### Recording and transcription

Primarily, the application captures audio during lectures or meetings in one of two ways
* Recording from your laptop microphone
* Streaming audio from your microphone to a live AI transcription cloude service.

YOu can do one or both by clicking on 'New Session' from the menu.  Some pointers:
* Live transcription is nice because there is immediate feedback, but it doesn't seem to be as good
* Recording the full audio and stopping at the end of the lecture results in a large mp3 file on your laptop that you can refer back to later
* If you don't have internet connection during the session, recording is the only option you have
* At any point after you have finished the session and saved the information, you can go back to the session information in the 'Sessions" menu
* If you have a saved mp3 file, you can request the entire file be transcribed or retranscribed.

So, ideally you would just record the meeting or choose to both record and live transcribe, but not JUST live transcribe.

### What to do while recording

Yuu can name the session and write notes in the app, and once you stop the session and save it, that information is stored as part of the session information.
If you are live transcribing as well, you can watch the live transcription and get distracted by it, but I don't recommend.

So, quickstart:

* [jump to starting a new session](/session)
* Click on 'Start' under 'Record Audio'
* At the end of the class/lecture/meeting, hit stop
* Confirm the name of the audio file and save it
* Add a name and notes if you want
* click the save button

### After recording

As you create and save session, the app saves the information for each session instance
* path to the audio file if you chose to record
* live transcript content if you chose that option
* date you created the session
* name and notes you added

As you go to classes/meetings and record, you will accumulate a list of sessions visible in the 'sessions' menu.  For each you can:

*  Request or rerequest a transcription if you have an audio file
*  tweak the transcript text
*  Request an AI interaction (summary, study guide, or whatever other interaction you configure) based on the transcription text

The transcript response and various AI interaction responses are in markdown format.  CLicking on the 'markdown' button will allow you to 
see the results in a nicely formatted view.  After any tweak or AI prompt response, save the instance.


Over time, you can go back to your instance list and review your sessions and their transcripts, summaries, study guides, etc.

[list of existing sessions](/list)

## Configuration

As it stands, I have a few ways to do recorded transcription, one way to do live transcription, and 3 LLM providers, each with multiple models for doing 
analysis of the transcript.  I have a few canned prompts you can use, tweak, or add to.

To use these AI providers, you'll need API keys.  I have them.  I'll give them to you, or you can get your own.  Each LLM provider and model for chat or transcription charges different amounts per million tokens or minutes of transcribed audio, and each combination does a better or worse job of handling your prompts and analyzing your transcripts.  You'll have to play around. If more LLM providers or models come around, they can be manually added in the 'AI Model Settings'

[AI settings](/settings)

## Prompts

There are a few canned prompts.  You can tweak or add as many as you want.  Each session with a transcript can be selectd in the 'sessions' view, and you can choose to run those prompts and keep the results with the instance, saving and reviewing them later.

[AI prompts](/prompts)

## Other things you can do

If you already have an audio file you want to add in, or you have a text transcript you want to analyze, you can open the 'session' view and
click on 'add manual instance', adding the path to the audio file or pasting in the transcript text accordingly.  Once you've done that, you can 
follow the flow as if you had created a session in the app (transcribe the audio, run prompts against the transcription)
