import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
  element;
  subElements = {};
  components = {};

  onDateSelect = async event => {
    const { from, to } = event.detail;
    this.from = from;
    this.to = to;
    const ordersPromise = this.components.ordersColumnChart.update(from, to);
    const salesPromise = this.components.salesColumnChart.update(from, to);
    const customersPromise = this.components.customersColumnChart.update(from, to);
    this.components.sortableTable.url.searchParams.set('from', from.toISOString());
    this.components.sortableTable.url.searchParams.set('to', to.toISOString());

    const bestsellerPromise
      = this.components.sortableTable.sortOnServer(
        this.components.sortableTable.sorted.id,
        this.components.sortableTable.sorted.order,
        1,
        this.components.sortableTable.step + 1);

    Promise.all([ordersPromise, salesPromise, customersPromise, bestsellerPromise]);
  };

  constructor() {
    const today = new Date();
    this.timeOffset = today.getTimezoneOffset();
    today.setMinutes(today.getMinutes() + this.timeOffset);
    this.from = new Date(today.setMonth(today.getMonth() - 1));
    this.to = new Date();
    this.components.rangePicker = new RangePicker({
      from: this.from,
      to: this.to
    });

    this.components.ordersColumnChart = new ColumnChart({
      label: 'Заказы',
      link: '/sales',
      formatHeading: data => data,
      url: 'api/dashboard/orders',
      range: {
        from: this.from,
        to: this.to,
      }
    });

    this.components.salesColumnChart = new ColumnChart({
      label: 'Продажи',
      formatHeading: data => data,
      url: 'api/dashboard/sales',
      range: {
        from: this.from,
        to: this.to,
      }
    });

    this.components.customersColumnChart = new ColumnChart({
      label: 'Клиенты',
      formatHeading: data => data,
      url: 'api/dashboard/customers',
      range: {
        from: this.from,
        to: this.to,
      }
    });

    const url = new URL('api/dashboard/bestsellers', BACKEND_URL);
    url.searchParams.set('from', this.from.toISOString());
    url.searchParams.set('to', this.to.toISOString());
    this.components.sortableTable = new SortableTable(header, {
      url: url.toString(),
      isSortLocally: true
    });
  }

  get template() {
    return `<div class="dashboard full-height flex-column">
    <div class="content__top-panel">
      <h2 class="page-title">Панель управления</h2>
    </div>
    <div class="dashboard__charts">
    </div>
    <h3 class="block-title">Лидеры продаж</h3>
    </div>`;
  }

  async render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;

    this.subElements.topPanel = element.querySelector('.content__top-panel');

    this.subElements.topPanel.append(this.components.rangePicker.element);
    this.subElements.rangePicker = element.querySelector('.rangepicker');

    this.subElements.charts = element.querySelector('.dashboard__charts');

    this.subElements.charts.append(this.components.ordersColumnChart.element);
    this.subElements.charts.append(this.components.salesColumnChart.element);
    this.subElements.charts.append(this.components.customersColumnChart.element);
    this.subElements.ordersChart = element.querySelector('.dashboard__chart_orders');
    this.subElements.salesChart = element.querySelector('.dashboard__chart_sales');
    this.subElements.customersChart = element.querySelector('.dashboard__chart_customers');

    this.element.append(this.components.sortableTable.element);
    this.subElements.sortableTable = element.querySelector('.sortable-table');

    this.initEventListeners();

    return this.element;
  }

  initEventListeners() {
    this.element.addEventListener('date-select', this.onDateSelect);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    for (const component of Object.values(this.components)) {
      if (component.destroy instanceof Function) {
        component.destroy();
      }
    }

    this.remove();
    this.element = null;
  }
}
