export type MenuItem = {
  id: number;
  menu_category_id: number | null;
  item_name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  is_available: boolean;
}

export type MenuCategory = {
  id: number;
  category_name: string;
}

export type LandingData = {
  restaurant_name: string;
  menu: {
    menu_name: string;
    description: string;
    menu_items: MenuItem[];
    menu_categories: MenuCategory[];
  };
}

// export type

export type LandingResponse = {
  success: true;
  data: LandingData;
}