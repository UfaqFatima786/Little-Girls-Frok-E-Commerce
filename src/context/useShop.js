import { useContext } from "react";
import { ShopContext } from "./shopContext.js";

export const useShop = () => useContext(ShopContext);
