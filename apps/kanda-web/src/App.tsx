import { useEffect, useState, type FormEvent } from "react";

const BUSINESS_ID = "cmvcgldqi0000wkuvb6hfiwq0";
const API_URL = import.meta.env.VITE_API_URL || ""; // <-- ADICIONADO AQUI

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
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // CORRIGIDO AQUI: Usar API_URL
    fetch(`${API_URL}/api/v1/store/${BUSINESS_ID}`)
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
        if (existing.quantity >= product.stock) {
          setErrorMsg("Limite de stock atingido para este produto.");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setErrorMsg(null);
  }

  function decreaseQuantity(productId: string) {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId) {
          return item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item;
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });
  }

  function increaseQuantity(productId: string) {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId && item.quantity < item.stock) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      // CORRIGIDO AQUI: Usar API_URL
      const res = await fetch(`${API_URL}/api/v1/store/checkout`, {
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
      
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.details) {
          const field = Object.keys(data.error.details)[0];
          throw new Error(data.error.details[field][0]);
        }
        throw new Error(data.error?.message || "Erro ao processar o pedido.");
      }
      
      setCart([]);
      setFormData({ name: "", phone: "", address: "" });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-zinc-500">
        <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
        <p>A acordar a loja, aguarde um momento...</p>
      </div>
    );
  }

  if (!store) return <div className="min-h-screen flex items-center justify-center bg-zinc-50">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row relative">
      <div className="flex-1 p-6 lg:p-10">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900">{store.businessName}</h1>
          <p className="text-zinc-500 mt-1">Bem-vindo à nossa loja online</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

      <aside className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-zinc-200 flex flex-col lg:h-screen lg:sticky lg:top-0">
        <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900">O seu Carrinho</h2>
          <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full text-xs font-bold">
            {cart.reduce((acc, item) => acc + item.quantity, 0)} itens
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[40vh] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="text-center mt-10">
              <p className="text-zinc-500 mb-4">O carrinho está vazio.</p>
              <button onClick={() => window.scrollTo(0, 0)} className="text-sm text-zinc-900 underline">Ver produtos</button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 border-b border-zinc-100 pb-4">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-zinc-900">{item.name}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700" title="Remover item">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center border border-zinc-300 rounded-lg">
                    <button onClick={() => decreaseQuantity(item.id)} className="px-3 py-1 text-zinc-600 hover:bg-zinc-100">-</button>
                    <span className="px-3 py-1 text-sm font-medium border-x border-zinc-300">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)} disabled={item.quantity >= item.stock} className="px-3 py-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">+</button>
                  </div>
                  <span className="font-bold text-zinc-900">{(item.price * item.quantity).toLocaleString("pt-AO")} Kz</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}
            <div className="flex justify-between items-center mb-4 text-lg font-bold text-zinc-900">
              <span>Total:</span>
              <span>{cartTotal.toLocaleString("pt-AO")} Kz</span>
            </div>

            <form onSubmit={handleCheckout} className="space-y-3">
              <input required placeholder="O seu nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <input required placeholder="Telefone (ex: 923111222)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <input required placeholder="Endereço de entrega" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              <button type="submit" disabled={submitting} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 mt-2 transition-colors disabled:opacity-50">
                {submitting ? "A processar..." : "Finalizar Pedido"}
              </button>
            </form>
          </div>
        )}
      </aside>

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