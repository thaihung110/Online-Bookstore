import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Mở rộng UserDocument để bao gồm phương thức comparePassword
export interface UserDocument extends User, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  resetPasswordToken: string;

  @Prop({ type: Date, default: null })
  resetPasswordExpires: Date;



  @Prop({ type: Number, default: 0 })
  loyaltyPoints: number;

  // Phương thức comparePassword được di chuyển sang schema methods
}

export const UserSchema = SchemaFactory.createForClass(User);

// Middleware to hash password before saving
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Đăng ký phương thức comparePassword vào schema methods
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add a virtual field for the user's full name
UserSchema.virtual('isAdmin').get(function () {
  return this.role === 'admin';
});
