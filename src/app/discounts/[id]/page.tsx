import DiscountForm from '../components/DiscountForm';

export default function EditDiscountPage({ params }: { params: { id: string } }) {
  return <DiscountForm params={params} />;
} 