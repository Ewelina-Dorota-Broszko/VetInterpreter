import { Component, OnInit } from '@angular/core';
import { ChatMessageVM, ChatService, ChatThreadVM } from '../services/chat.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {

threadId=''; thread?: ChatThreadVM; msgs: ChatMessageVM[]=[]; text='';
  constructor(private route:ActivatedRoute, private chat:ChatService){}
  ngOnInit(){
    this.threadId=this.route.snapshot.params['id'];
    this.chat.myThreads().subscribe(ts=>{
      this.thread = ts.find(x=>x.id===this.threadId);
    });
    this.load();
  }
  load(){ this.chat.getMessages(this.threadId, 100).subscribe(m=>this.msgs=m); }
  send(){
    if(!this.thread?.canSend || !this.text.trim()) return;
    this.chat.sendMessage(this.threadId, this.text).subscribe(()=>{ this.text=''; this.load(); });
  }

}
