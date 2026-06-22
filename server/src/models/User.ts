import mongoose from 'mongoose';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface IPaymentDetails {
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  bankName?: string;
  aadhaarLast4?: string;
  isVerified: boolean;
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'farmer' | 'consumer' | 'admin';
  phone?: string;
  address?: string;
  location?: IGeoPoint;
  savedAddresses?: ISavedAddress[];
  paymentDetails?: IPaymentDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISavedAddress {
  _id?: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: [number, number]; // [lng, lat]
  isDefault: boolean;
}

const geoPointSchema = new mongoose.Schema<IGeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) => value.length === 2,
        message: 'Location coordinates must contain [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const savedAddressSchema = new mongoose.Schema<ISavedAddress>(
  {
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
      required: true,
    },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0],
      validate: {
        validator: (value: number[]) => value.length === 2,
        message: 'Coordinates must contain [longitude, latitude]',
      },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function (): boolean {
        return !this.googleId;
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    avatar: { type: String },

    role: {
      type: String,
      enum: ['farmer', 'consumer', 'admin'],
      default: 'consumer',
    },

    phone: { type: String },
    address: { type: String },
    location: { type: geoPointSchema, required: false },
    savedAddresses: { type: [savedAddressSchema], default: [] },
    paymentDetails: {
      upiId: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      accountHolderName: { type: String },
      bankName: { type: String },
      aadhaarLast4: { type: String, maxlength: 4 },
      isVerified: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

export const User = mongoose.model<IUser>('User', userSchema);
