import { Component, OnInit } from '@angular/core';
import { ChatService, ChatThreadVM } from '../services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vet-messages-panel',
  templateUrl: './vet-messages-panel.component.html',
  styleUrls: ['./vet-messages-panel.component.scss']
})
export class VetMessagesPanelComponent implements OnInit {

  requests: any[] = [];
  threads: ChatThreadVM[] = [];

  ownerQuery = '';
  owners: any[] = [];
  selectedOwner: any = null;
  firstText = '';

  constructor(private chat: ChatService, private router: Router) { }

  ngOnInit() { this.reload(); }

  reload() {
    this.chat.vetListRequests().subscribe(r => this.requests = r);
    this.chat.myThreads().subscribe(t => this.threads = t);
  }

  accept(id: string) {
    this.chat.vetAcceptRequest(id).subscribe(() => this.reload());
  }

  decline(id: string) {
    this.chat.vetDeclineRequest(id).subscribe(() => this.reload());
  }

  /** 🔍 Wyszukiwanie właścicieli */
 searchOwners() {
  const q = this.ownerQuery.trim();
  if (!q) {
    this.owners = [];
    return;
  }

  this.chat.listOwners(q).subscribe((owners: any[]) => {
    this.owners = owners;
  });
}


  selectOwner(o: any) {
    this.selectedOwner = o;
    this.ownerQuery = `${o.name || o.email}`;
    this.owners = [];
  }

  start() {
    if (!this.selectedOwner) return;
    this.chat.vetStart(this.selectedOwner._id, this.firstText)
      .subscribe(() => {
        this.reload();
        this.selectedOwner = null;
        this.ownerQuery = '';
        this.firstText = '';
      });
  }

  openChat(t: ChatThreadVM) {
    this.router.navigate(['/chat', t.id]);
  }
}
