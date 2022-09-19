import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CounterIdDocument = CounterId & Document;

@Schema({
  timestamps: true,
  collection: 'CounterId',
  id: false,
})
export class CounterId {
  @Prop({ type: String })
  _id: string;

  @Prop({ type: Number, default: 0 })
  sequenceValue: number;
}

export const CounterIdSchema = SchemaFactory.createForClass(CounterId);
