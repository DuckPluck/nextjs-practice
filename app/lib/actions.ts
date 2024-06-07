'use server';

import { z } from 'zod';
import axios from 'axios';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';


const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string(),
});

// zod validation
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    };
  }

  const amountInCents = validatedFields.data.amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const customerData: {data: Customer[]} = await axios.get(`http://localhost:3001/customers?id=${validatedFields.data.customerId}`);

  const invoiceData = {
    customer_id: validatedFields.data.customerId,
    amount: amountInCents,
    date,
    status: validatedFields.data.status,
    image_url: customerData.data[0].image_url,
    name: customerData.data[0].name,
    email: customerData.data[0].email,
  };

  try {
    await axios.post('http://localhost:3001/invoices', invoiceData);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }

  revalidatePath('/dashboard/invoices'); // clear client cache for fetch new invoices list
  redirect('/dashboard/invoices');
}

export async function updateInvoice(prevState: State, id: string, formData: FormData) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Invoice.'
    };
  }

  const { customerId, amount, status } = validateFields.data;

  const amountInCents = amount * 100;

  const customerData: {data: Customer[]} = await axios.get(`http://localhost:3001/customers?id=${customerId}`);

  const invoiceData = {
    customer_id: customerId,
    amount: amountInCents,
    status: status,
    image_url: customerData.data[0].image_url,
    name: customerData.data[0].name,
    email: customerData.data[0].email,
  };

  try {
    await axios.patch(`http://localhost:3001/invoices/${id}`, invoiceData);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await axios.delete(`http://localhost:3001/invoices/${id}`);
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.')
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error && 'type' in error) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
