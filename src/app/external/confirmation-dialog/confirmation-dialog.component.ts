import { Component,EventEmitter, Output  } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.css'
})
export class ConfirmationDialogComponent {

  
  @Output() confirmed = new EventEmitter<boolean>();

  constructor() {}

  confirm(confirmation: boolean): void {
    this.confirmed.emit(confirmation);
  }

}

