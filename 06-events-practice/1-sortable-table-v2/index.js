export default class SortableTable {
  element;
  subElements = {};

  constructor(headerConfig, {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    },
    isSortLocally = true
  } = {}) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.sorted = sorted;
    this.isSortLocally = isSortLocally;

    this.eventFunctions = [];

    this.render();

    this.sort(this.sorted.id, this.sorted.order);
  }

  get template() {
    return `
    <div data-element="productsContainer" class="products-list__container">
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getTableHeader()}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.tableRows}
        </div>
      </div>
    </div>`;
  }

  getTableHeader(fieldValue = this.sorted.id, orderValue = this.sorted.order) {
    return this.headerConfig
      .map(({id, title, sortable}) => {
        const isSortedField = id === fieldValue;
        return `<div class="sortable-table__cell"
          data-id="${id}"
          data-sortable="${sortable}"
          ${isSortedField ? 'data-order="' + orderValue + '"' : ''}>
          <span>${title}</span>
          ${isSortedField ? this.sortArrow : ''}
        </div>`;
      }
      )
      .join('');
  }

  get sortArrow() {
    return `<span data-element="arrow" class="sortable-table__sort-arrow">
                <span class="sort-arrow"></span>
            </span>`;
  }

  get tableRows() {
    return this.data
            .map((row) =>
        `<a href="/products/${row.id || '#'}" class="sortable-table__row">
          ${this.getFields(row)}
        </a>`)
      .join('');

  }

  getFields(row) {
    return this.headerConfig
      .map(field => {
        if (field.id === 'images' && typeof field.template === 'function') {
          return field.template(row.images);
        } else if (field.id !== 'id') {
          return `<div class="sortable-table__cell">${row[field.id]}</div>`;
        }
      })
      .join('');
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element) {
    const result = {};
    const elements = element.querySelectorAll('[data-element]');

    for (const subElement of elements) {
      const name = subElement.dataset.element;

      result[name] = subElement;
    }

    return result;
  }

  initEventListeners() {
    if (Object.entries(this.eventFunctions).length > 0) {
      this.destroyEventListeners();
    }
    const headers = this.element.querySelectorAll('[data-sortable="true"]');
    headers.forEach((elem) => {
      const fieldValue = elem.dataset.id;
      const orderValue = this.sorted.order === 'asc' ? 'desc' : 'asc';

      if (!this.eventFunctions[fieldValue + orderValue]) {
        this.eventFunctions[fieldValue + orderValue] = () => {
          this.sort(fieldValue, orderValue);
        };
      }

      elem.addEventListener('pointerdown', this.eventFunctions[fieldValue+orderValue]);
    });
  }

  destroyEventListeners() {
    if (this.element) {
      const headers = this.element.querySelectorAll('[data-sortable="true"]');
      headers.forEach((elem) => {
        const fieldValue = elem.dataset.id;
        elem.removeEventListener('pointerdown', this.eventFunctions[fieldValue]);
      });

      this.eventFunctions = {};
    }
  }

  sort(fieldValue, orderValue) {
    this.sorted.id = fieldValue;
    this.sorted.order = orderValue;

    if (this.isSortLocally) {
      this.sortOnClient();
    } else {
      this.sortOnServer();
    }

    this.initEventListeners();
  }

  sortOnClient() {
    const fieldValue = this.sorted.id;
    const orderValue = this.sorted.order;
    const fieldConfig = this.headerConfig.find(field => field.id === fieldValue);
    this.data = sortObjects(this.data, fieldValue, fieldConfig.sortType, orderValue);
    const oldSortedField = this.subElements.header.querySelector(`[data-order]`);
    if (oldSortedField !== null) {
      const arrowElement = oldSortedField.lastElementChild;
      delete oldSortedField.dataset.order;
      const newSortedField = this.subElements.header.querySelector(`[data-id="${fieldValue}"]`);
      newSortedField.dataset.order = orderValue;
      newSortedField.append(arrowElement.cloneNode(true));
      arrowElement.remove();
    }

    this.subElements.body.innerHTML = this.tableRows;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.destroyEventListeners();
    this.remove();
    this.element = null;
  }
}

function sortObjects(arr, field, sortType, param = 'asc') {
  const result = [...arr];
  const directions = {
    asc: 1,
    desc: -1
  };
  let compareFunction = compareStrings;
  if (sortType === 'number') {
    compareFunction = compareNumbers;
  }

  result.sort((a, b) => directions[param] * compareFunction(a[field], b[field]));
  return result;
}

/**
 * compareStrings - compares two normalizes string by criteria "asc" or "desc"
 * @param {string} a - string
 * @param {string} b - string
 * @returns {number} - if a > b => 1, if a < b => -1, if a = b => 0(-0)
 */
function compareStrings(a, b) {
  return a.localeCompare(b, ['ru', 'en'], {caseFirst: 'upper'});
}

/**
 * compareNumbers - compares two numbers by criteria "asc" or "desc"
 * @param {string} a - string
 * @param {string} b - string
 * @returns {number} - if a > b => 1, if a < b => -1, if a = b => 0(-0)
 */
function compareNumbers(a, b) {
  return a - b;
}
