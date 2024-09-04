import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ElectronRenderService } from '../../services/electronRender.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-aes-config',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './aes-config.component.html',
  styleUrl: './aes-config.component.css'
})
export class AesConfigComponent {
    private _snackBar = inject(MatSnackBar);

    plain = '';
    encrypted = '';
    key = '';

    jsonDoc = '';
    constructor(private electronRenderService: ElectronRenderService) {}

    encrypt() {
      try {
        this.electronRenderService.Encrypt(this.plain, this.key).subscribe((x) => {
          this.encrypted = x;

          const uploadDocument = {
            creationDate: new Date().toLocaleString(),
            content: x,
          }

          this.jsonDoc = JSON.stringify(uploadDocument, null, 2);
        });
      } catch (error) {
        this._snackBar.open(`ERROR: ${error}`)
      }
    }
    getRemoteConfig() {
      this.electronRenderService.RemoteConfig().subscribe((x) => this.encrypted = x.content)
    }

    decrypt() {
      try {
        this.electronRenderService.Decrypt(this.encrypted, this.key).subscribe((x) => this.plain = x);
      } catch (error) {
        this._snackBar.open(`ERROR: ${error}`)
      }
    }
}
