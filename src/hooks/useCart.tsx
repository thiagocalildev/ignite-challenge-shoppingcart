import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

  // TODO
  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get('/stock', {
        params: {
          id: productId,
        },
      });

      const productStock: Stock = responseStock.data[0];
      if (productStock.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      console.log(productStock);

      const storagedCart = localStorage.getItem('@RocketShoes:cart');

      // Create a new cart with selected product
      if (!storagedCart) {
        const responseProducts = await api.get('/products', {
          params: {
            id: productId,
          },
        });

        const newProduct: Product = {
          ...responseProducts.data[0],
          amount: 1,
        };

        const newCart = [newProduct];
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        setCart(newCart);

        return;
      }

      const productInCart = cart.find((p) => p.id === productId);

      // Add new product in existing cart
      if (!productInCart) {
        const responseProducts = await api.get('/products', {
          params: {
            id: productId,
          },
        });

        const newProduct: Product = {
          ...responseProducts.data[0],
          amount: 1,
        };

        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, newProduct])
        );

        setCart([...cart, newProduct]);
        return;
      }

      // Verify if existing product have enough stock
      if (productStock.amount - productInCart.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // Update existing product stock in cart
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
      // TODO
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
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
