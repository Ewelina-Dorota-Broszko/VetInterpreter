import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

export interface ChatThreadVM {
  id: string;
  vet: any;
  owner: any;
  initiatedBy: 'vet'|'owner';
  pending: boolean;
  status: 'pending'|'active'|'expired'|'closed';
  windowTo?: string;
  lastMessageAt?: string;
  canSend: boolean;
  hadMessages: boolean;
}

export interface ChatMessageVM {
  _id: string;
  threadId: string;
  authorRole: 'vet'|'owner'|'system';
  text: string;
  kind: 'text'|'window-start';
  sentAt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // owner:
  requestChat(vetId: string) {
    return this.http.post<{ok: boolean; threadId: string}>(`${this.api}/chat/client/request`, { vetId });
  }

  // vet:
  vetListRequests() {
    return this.http.get<any[]>(`${this.api}/chat/vet/requests`);
  }
  vetAcceptRequest(threadId: string) {
    return this.http.post(`${this.api}/chat/vet/requests/${threadId}/accept`, {});
  }
  vetDeclineRequest(threadId: string) {
    return this.http.post(`${this.api}/chat/vet/requests/${threadId}/decline`, {});
  }
  vetStart(ownerId: string, text?: string) {
    return this.http.post<{ok: boolean; threadId: string}>(`${this.api}/chat/vet/start`, { ownerId, text });
  }

  // wspólne:
  myThreads(): Observable<ChatThreadVM[]> {
    return this.http.get<ChatThreadVM[]>(`${this.api}/chat/me/threads`);
  }
  getMessages(threadId: string, limit = 50, before?: string) {
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<ChatMessageVM[]>(`${this.api}/chat/threads/${threadId}/messages`, { params });
  }
  sendMessage(threadId: string, text: string) {
    return this.http.post<ChatMessageVM>(`${this.api}/chat/threads/${threadId}/messages`, { text });
  }
}
