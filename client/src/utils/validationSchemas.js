import * as yup from "yup";

export const loginSchema = yup.object({
   email: yup
      .string()
      .trim()
      .required("Email is required")
      .email("Enter a valid email"),
   password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
});

// Signup schema is used in the next step (Signup page).
export const signupSchema = yup.object({
   name: yup
      .string()
      .trim()
      .required("Full name is required")
      .min(2, "Name is too short"),
   email: yup
      .string()
      .trim()
      .required("Email is required")
      .email("Enter a valid email"),
   role: yup
      .string()
      .oneOf(["student", "faculty"], "Choose a role")
      .required("Role is required"),
   department: yup.string().trim().required("Department is required"),
   identifier: yup.string().trim(),
   password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
   confirm: yup
      .string()
      .required("Please confirm your password")
      .oneOf([yup.ref("password")], "Passwords do not match"),
});

export const verifySchema = yup.object({
   certificateId: yup
      .string()
      .trim()
      .required('Enter a certificate ID')
      .matches(/^CERT-[A-Z0-9]+$/i, 'Use the format CERT-A1B2C3D4E5'),
});