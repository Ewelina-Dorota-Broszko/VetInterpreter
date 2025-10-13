import { Component, OnInit } from '@angular/core';
import { ChatService, ChatThreadVM } from '../services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vet-messages-panel',
  templateUrl: './vet-messages-panel.component.html',
  styleUrls: ['./vet-messages-panel.component.scss']
})
export class VetMessagesPanelComponent implements OnInit {

  requests: any[] = []; threads: ChatThreadVM[] = [];
  ownerId = ''; firstText = '';
  constructor(private chat: ChatService,
    private router: Router,  
  ) { }
  ngOnInit() { this.reload(); }
  reload() { this.chat.vetListRequests().subscribe(r => this.requests = r); this.chat.myThreads().subscribe(t => this.threads = t); }
  accept(id: string) { this.chat.vetAcceptRequest(id).subscribe(() => this.reload()); }
  decline(id: string) { this.chat.vetDeclineRequest(id).subscribe(() => this.reload()); }
  start() { this.chat.vetStart(this.ownerId, this.firstText).subscribe(() => this.reload()); }
 openChat(t: ChatThreadVM) {
    this.router.navigate(['/chat', t.id]);   // ✅ używaj this.router
  }}
