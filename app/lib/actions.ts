'use server';

import { z } from 'zod';
import axios from 'axios';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';


const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// zod validation
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const rawFormData = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = rawFormData.amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const customerData: {data: Customer[]} = await axios.get(`http://localhost:3001/customers?id=${rawFormData.customerId}`);

  const invoiceData = {
    customer_id: rawFormData.customerId,
    amount: amountInCents,
    date,
    status: rawFormData.status,
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

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

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
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.')
  }

  revalidatePath('/dashboard/invoices');
}
