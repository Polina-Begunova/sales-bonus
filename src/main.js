/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const discountDecimal = 1 - discount / 100;
  return sale_price * quantity * discountDecimal;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 0) {
    // Первое место - 15%
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    // Второе и третье место - 10%
    return profit * 0.1;
  } else if (index === total - 1) {
    // Последнее место - 0%
    return 0;
  } else {
    // Все остальные - 5%
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0 ||
    !Array.isArray(data.products) ||
    data.products.length === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;
  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = sellerStats.reduce((result, seller) => {
    result[seller.id] = seller;
    return result;
  }, {});
  const productIndex = data.products.reduce((result, product) => {
    result[product.sku] = product;
    return result;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) {
      return; // Пропускаем если продавец не найден
    }
    // Увеличиваем количество продаж
    seller.sales_count += 1;
    // Увеличиваем общую выручку (без учета скидок)
    seller.revenue += record.total_amount;
    // Расчет прибыли для каждого товара в чеке
    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) {
        return; // Пропускаем если товар не найден
      }

      // Расчет себестоимости
      const cost = product.purchase_price * item.quantity;

      // Расчет выручки с учетом скидки
      const revenue = calculateRevenue(item, product);

      // Расчет прибыли (выручка с учетом скидки минус себестоимость)
      const profit = revenue - cost;

      // Увеличиваем общую накопленную прибыль продавца
      seller.profit += profit;

      // Учет количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли по убыванию - первы продавец с самой высокой прибылью
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  const totalSellers = sellerStats.length;
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, totalSellers, seller);
    // Формирование топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
