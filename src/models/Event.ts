
import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  chainId: number;
  contractAddress: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  eventName: string;
  args: any;
  createdAt: Date;
}

const EventSchema: Schema = new Schema({
  chainId: { type: Number, required: true },
  contractAddress: { type: String, required: true },
  blockNumber: { type: Number, required: true },
  transactionHash: { type: String, required: true },
  logIndex: { type: Number, required: true },
  eventName: { type: String, required: false },
  args: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Compound unique index to prevent duplicates
EventSchema.index({ chainId: 1, transactionHash: 1, logIndex: 1 }, { unique: true });

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
