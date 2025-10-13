import { Component, OnInit } from '@angular/core';
import { ChatService, ChatThreadVM } from '../services/chat.service';
import { VetService } from '../services/vet.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-messages-panel',
  templateUrl: './client-messages-panel.component.html',
  styleUrls: ['./client-messages-panel.component.scss']
})
export class ClientMessagesPanelComponent implements OnInit {

  vetQuery = ''; vets: any[] = [];
  threads: ChatThreadVM[] = [];
  constructor(private chat: ChatService,
    private vet: VetService,
    private router: Router,
  ) { }
  ngOnInit() { this.refresh(); }
  refresh() { this.chat.myThreads().subscribe(t => this.threads = t); }
  searchVets() {
    this.vet.listVets().subscribe(v => {
      const q = this.vetQuery.trim().toLowerCase();
      this.vets = v.filter((x: any) => JSON.stringify(x).toLowerCase().includes(q));
    });
  }
  request(vetId: string) { this.chat.requestChat(vetId).subscribe(() => this.refresh()); }
  openChat(t: ChatThreadVM) {
    this.router.navigate(['/chat', t.id]);   // ✅ używaj this.router
  }
}
