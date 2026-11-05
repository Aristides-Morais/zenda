import { useEffect, useState, type FormEvent } from "react";

const BUSINESS_ID = "cmvcgldqi0000wkuvb6hfiwq0";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
};

type StoreData = {
  businessName: string;
  categories: any[];
  products: Product[];
};

type CartItem = Product & { quantity: number };

export default function App() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  
  // Estado para o ecrã de sucesso
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/store/${BUSINESS_ID}`)
      .then((res) => res.json())
      .then((data) => {
        setStore(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: BUSINESS_ID,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      });
      
      if (!res.ok) throw new Error("Erro no checkout");
      
      setCart([]);
      setFormData({ name: "", phone: "", address: "" });
      setIsSuccess(true);
    } catch (err) {
      alert("Erro ao processar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">A carregar loja...</div>;
  if (!store) return <div className="min-h-screen flex items-center justify-center">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row relative">
      <div className="flex-1 p-6 md:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900">{store.businessName}</h1>
          <p className="text-zinc-500 mt-1">Bem-vindo à nossa loja online</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {store.products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col">
              <div className="h-48 bg-zinc-100 flex items-center justify-center text-zinc-400">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">Sem imagem</span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg text-zinc-900">{product.name}</h3>
                <p className="text-sm text-zinc-500 mb-4 flex-1">{product.description || "Sem descrição"}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-zinc-900">{product.price.toLocaleString("pt-AO")} Kz</span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {product.stock === 0 ? "Esgotado" : "Adicionar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carrinho */}
      <aside className="w-full md:w-96 bg-white border-l border-zinc-200 flex flex-col min-h-screen">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900">O seu Carrinho</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <p className="text-zinc-500 text-center mt-10">O carrinho está vazio.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b border-zinc-100 pb-4">
                <div>
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <p className="text-sm text-zinc-500">{item.quantity}x {item.price.toLocaleString("pt-AO")} Kz</p>
                </div>
                <span className="font-bold text-zinc-900">{(item.price * item.quantity).toLocaleString("pt-AO")} Kz</span>
              </div>
            ))
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50">
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-zinc-900">
              <span>Total:</span>
              <span>{cartTotal.toLocaleString("pt-AO")} Kz</span>
            </div>
            
            <form onSubmit={handleCheckout} className="space-y-3">
              <input required placeholder="O seu nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <input required placeholder="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <input required placeholder="Endereço de entrega" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 mt-2 transition-colors disabled:opacity-50">
                {submitting ? "A processar..." : "Finalizar Pedido"}
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Modal de Sucesso (Substitui o alert) */}
      {isSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Pedido Confirmado!</h2>
            <p className="text-zinc-500 mb-8">
              O seu pedido foi efetuado com sucesso. O vendedor entrará em contacto brevemente para combinar a entrega.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="w-full bg-zinc-900 text-white py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
            >
              Continuar a comprar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}