import { useCallback, useMemo, useRef, useState } from 'react';

// Runs a Yup schema synchronously and returns { field: firstMessage }.
const runValidation = (schema, values) => {
   if (!schema) return {};
   try {
      schema.validateSync(values, { abortEarly: false });
      return {};
   } catch (err) {
      if (!err.inner) throw err;
      return err.inner.reduce((acc, e) => {
         if (e.path && !acc[e.path]) acc[e.path] = e.message;
         return acc;
      }, {});
   }
};

export default function useForm({ initialValues, validationSchema, onSubmit }) {
   const [values, setValues] = useState(initialValues);
   const [touched, setTouched] = useState({});
   const [serverErrors, setServerErrorsState] = useState({});
   const [isSubmitting, setIsSubmitting] = useState(false);

   const initialRef = useRef(initialValues);

   // Client errors are derived from values, so they are never stale (cross-field rules work)
   const clientErrors = useMemo(
      () => runValidation(validationSchema, values),
      [validationSchema, values]
   );

   // Server errors win over client errors for the same field
   const errors = useMemo(() => ({ ...clientErrors, ...serverErrors }), [clientErrors, serverErrors]);

   const clearServerError = useCallback((name) => {
      setServerErrorsState((prev) => {
         if (!prev[name]) return prev;
         const { [name]: _removed, ...rest } = prev;
         return rest;
      });
   }, []);

   const setFieldValue = useCallback(
      (name, value) => {
         setValues((prev) => ({ ...prev, [name]: value }));
         clearServerError(name);
      },
      [clearServerError]
   );

   const handleChange = useCallback(
      (e) => {
         const { name, type, value, checked } = e.target;
         setFieldValue(name, type === 'checkbox' ? checked : value);
      },
      [setFieldValue]
   );

   const handleBlur = useCallback((e) => {
      const { name } = e.target;
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
   }, []);

   // Maps backend [{field,message}] (via getFieldErrors) onto fields and shows them
   const setServerErrors = useCallback((errorMap = {}) => {
      setServerErrorsState(errorMap);
      setTouched((prev) => ({ ...prev, ...Object.fromEntries(Object.keys(errorMap).map((k) => [k, true])) }));
   }, []);

   const reset = useCallback((nextValues) => {
      setValues(nextValues || initialRef.current);
      setTouched({});
      setServerErrorsState({});
   }, []);

   const handleSubmit = useCallback(
      async (e) => {
         e?.preventDefault();
         if (isSubmitting) return;

         // Show every error on submit
         setTouched(Object.fromEntries(Object.keys(initialRef.current).map((k) => [k, true])));
         if (Object.keys(clientErrors).length > 0) return;

         setIsSubmitting(true);
         setServerErrorsState({});
         try {
            await onSubmit(values, { setServerErrors, reset, setFieldValue });
         } finally {
            setIsSubmitting(false);
         }
      },
      [isSubmitting, clientErrors, onSubmit, values, setServerErrors, reset, setFieldValue]
   );

   // Spread into FormInput / FormSelect / FormTextarea: <FormInput {...getFieldProps('email')} />
   // `error` is only set once the field is touched.
   const getFieldProps = useCallback(
      (name) => ({
         name,
         value: values[name] ?? '',
         onChange: handleChange,
         onBlur: handleBlur,
         error: touched[name] ? errors[name] : undefined,
      }),
      [values, touched, errors, handleChange, handleBlur]
   );

   return {
      values,
      errors,
      touched,
      isSubmitting,
      isValid: Object.keys(clientErrors).length === 0,
      handleChange,
      handleBlur,
      handleSubmit,
      setServerErrors,
      setFieldValue,
      setValues,
      reset,
      getFieldProps,
   };
}