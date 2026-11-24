
import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe
} from 'firebase/firestore';

import { db } from '../firebase.config';

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // Create a unique conversation ID for two employees.
  async getOrCreateChat(
    currentUserId: string,
    otherUserId: string
  ): Promise<string> {

    const participants = [currentUserId, otherUserId].sort();

    const chatId = participants.join('_');

    const chatRef = doc(db, 'chats', chatId);

    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, {
        participantIds: participants,
        createdAt: serverTimestamp()
      });
    }

    return chatId;
  }

  // Listen for messages in real time.
  subscribeToMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {

    const messagesRef = collection(
      db,
      'chats',
      chatId,
      'messages'
    );

    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      messagesQuery,

      (snapshot) => {

        const messages: ChatMessage[] = [];

        snapshot.forEach((messageDoc) => {

          const data = messageDoc.data();

          messages.push({
            id: messageDoc.id,
            senderId: data['senderId'],
            text: data['text'],
            createdAt: data['createdAt']
              ? data['createdAt'].toDate()
              : null
          });

        });

        callback(messages);
      },

      (error) => {
        console.error('Message listener error:', error);
        onError?.(error);
      }
    );
  }

  // Send a message.
  async sendMessage(
    chatId: string,
    senderId: string,
    messageText: string
  ): Promise<void> {

    const text = messageText.trim();

    if (!text) {
      return;
    }

    const messagesRef = collection(
      db,
      'chats',
      chatId,
      'messages'
    );

    await addDoc(messagesRef, {
      senderId: senderId,
      text: text,
      createdAt: serverTimestamp()
    });
  }
}
