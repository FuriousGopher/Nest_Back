import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Device {
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
  lastActiveDate: string;
  @Prop()
  expirationDate: number;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
