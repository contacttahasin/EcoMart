export type VendorPersonalInfo = {
  fullLegalName: string;
  businessName: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  password: string;
};

export type VendorBusinessInfo = {
  shopName: string;
  businessType: string;
  businessCategory: string;
  address: string;
  postalCode: string;
};

export type VendorVerificationInfo = {
  idFrontFileName: string | null;
  idBackFileName: string | null;
  selfieCaptured: boolean;
};

export type VendorPayoutInfo = {
  bankName: string;
  branch: string;
  accountHolderName: string;
  accountNumber: string;
  verificationDocumentFileName: string | null;
  legalAgreementAccepted: boolean;
};

export type VendorRegistrationData = {
  personal: VendorPersonalInfo;
  business: VendorBusinessInfo;
  verification: VendorVerificationInfo;
  payout: VendorPayoutInfo;
};

/** The authenticated vendor account record — created once Step 4 is confirmed. */
export type VendorAccount = {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  avatar: string | null;
  createdAt: string;
};
