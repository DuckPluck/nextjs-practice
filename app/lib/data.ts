import { formatCurrency } from './utils';
import axios from 'axios';


export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  try {
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = (await fetch('http://localhost:3001/revenue')).json();
    console.log('Data fetch completed after 3 seconds.');

    return response;

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const response: LatestInvoiceRaw[] = await (await fetch('http://localhost:3001/invoices?_limit=5')).json();

    return response.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise: Promise<LatestInvoiceRaw[]> = (await fetch('http://localhost:3001/invoices')).json();
    const customerCountPromise: Promise<Customer[]> = (await fetch('http://localhost:3001/customers')).json();

    const response = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
    ]);

    const numberOfInvoices = Number(response[0]?.length ?? '0');
    const numberOfCustomers = Number(response[1]?.length ?? '0');
    const totalPaidInvoices = formatCurrency(response[0]?.reduce((sum: number, el: LatestInvoiceRaw) => {
      if (el.status === 'paid') {
        return sum + el.amount;
      }
      return sum;
    }, 0));
    const totalPendingInvoices = formatCurrency(response[0]?.reduce((sum: number, el: LatestInvoiceRaw) => {
      if (el.status === 'pending') {
        return sum + el.amount;
      }
      return sum;
    }, 0));

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await axios.get(`http://localhost:3001/invoices?_limit=${ITEMS_PER_PAGE}&_start=${offset}&name=${query}`)

    return invoices.data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const count = await axios.get(`http://localhost:3001/invoices?name=${query}`)

    return Math.ceil(Number(count.data.length) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await axios.get(`http://localhost:3001/invoices?id=${id}`)

    const invoice = data.data.map((invoice: Invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const response = await axios.get('http://localhost:3001/customers');

    return response.data;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const response = await axios.get('http://localhost:3001/customers');

    const customers = response.data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const response = await axios.get(`http://localhost:3001/customers${email}`);
    return response.data[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
