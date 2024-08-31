import { Component } from '@angular/core';

import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-material-showcase',
  standalone: true,
  imports: [
    MatGridListModule,
  ],
  templateUrl: './material-showcase.component.html',
  styleUrl: './material-showcase.component.css',
})
export class MaterialShowcaseComponent {}
