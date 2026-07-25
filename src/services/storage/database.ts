import Dexie, { type Table } from 'dexie';
import type { DayLog } from '../../domain/log';
import type { Attachment } from '../../domain/attachment';

export class TomatoDatabase extends Dexie {
  logs!: Table<DayLog, string>;
  attachments!: Table<Attachment, number>;

  constructor() {
    super('TomatoLogDB');
    this.version(1).stores({
      logs: 'date, updatedAt',
      attachments: '++id, date, filename'
    });
  }
}

export const db = new TomatoDatabase();
