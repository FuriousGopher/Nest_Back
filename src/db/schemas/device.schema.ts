import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DeviceDocument = HydratedDocument<DeviceMongo>;
@Schema()
export class DeviceMongo {
  @Prop()
  id: string;
  @Prop()
  ip: string;
  @Prop()
  title: string;
  @Prop()
  userId: string;
  @Prop()
  deviceId: string;
  @Prop()
  lastActiveDate: number;
  @Prop()
  expirationDate: number;
}

export const DeviceSchema = SchemaFactory.createForClass(DeviceMongo);
