import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product) => product.id === productId);
      const responseStock = await api.get(`/stock/${productId}`);
      const currentAmount = productInCart ? productInCart.amount : 0;
      const amountToAddInCart = currentAmount + 1;

      const productStock: number = responseStock.data.amount;

      if (amountToAddInCart > productStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (!productInCart) {
        const responseProducts = await api.get(`/products/${productId}`);

        const newProduct: Product = {
          ...responseProducts.data,
          amount: amountToAddInCart,
        };

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, newProduct])
        );

        setCart([...cart, newProduct]);
        return;
      }

      const updatedCart = cart.map((product) =>
        product.id === productId
          ? { ...product, amount: product.amount + 1 }
          : product
      );

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const foundProduct = cart.find((p) => p.id === productId);
      if (!foundProduct) {
        throw Error();
      }

      const updatedCart = cart.filter((product) => product.id !== productId);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }
      const responseStock = await api.get(`/stock/${productId}`);
      const productStock: number = responseStock.data.amount;

      if (amount > productStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = cart.map((product) =>
        product.id === productId ? { ...product, amount: amount } : product
      );

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
