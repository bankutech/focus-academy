const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

export const createFakeServices = () => {
  const data = new Map();
  const table = (name) => {
    if (!data.has(name)) data.set(name, new Map());
    return data.get(name);
  };

  const docRef = (name, id) => ({
    id,
    path: `${name}/${id}`,
    _name: name,
    async get() {
      const row = table(name).get(id);
      return { exists: row !== undefined, id, ref: docRef(name, id), data: () => clone(row) };
    },
    async set(value, options) {
      const current = table(name).get(id);
      table(name).set(id, options?.merge && current ? { ...current, ...clone(value) } : clone(value));
    },
    async update(value) {
      if (!table(name).has(id)) throw new Error('NOT_FOUND');
      table(name).set(id, { ...table(name).get(id), ...clone(value) });
    },
  });

  const query = (name, filters = []) => ({
    where(field, op, value) {
      return query(name, [...filters, { field, op, value }]);
    },
    async get() {
      const docs = [...table(name).entries()]
        .filter(([, row]) => filters.every(({ field, op, value }) => (op === 'in' ? value.includes(row[field]) : row[field] === value)))
        .map(([id, row]) => ({ id, ref: docRef(name, id), exists: true, data: () => clone(row) }));
      return { docs, empty: docs.length === 0 };
    },
    doc: (id) => docRef(name, id),
    _isQuery: true,
  });

  const db = {
    collection: (name) => query(name),
    async runTransaction(fn) {
      const writes = [];
      const tx = {
        get: (target) => target.get(),
        set: (ref, value, options) => writes.push(() => ref.set(value, options)),
        update: (ref, value) => writes.push(() => ref.update(value)),
      };
      const result = await fn(tx);
      for (const apply of writes) await apply();
      return result;
    },
  };

  const accounts = new Map();
  const auth = {
    async verifyIdToken(token) {
      const account = accounts.get(token);
      if (!account) throw new Error('invalid token');
      return account;
    },
  };

  return {
    services: { db, auth },
    seed: (name, id, value) => table(name).set(id, clone(value)),
    read: (name, id) => clone(table(name).get(id)),
    all: (name) => [...table(name).values()].map(clone),
    addAccount: (token, claims) => accounts.set(token, claims),
  };
};

export const mockResponse = () => {
  const res = { statusCode: 200, headers: {}, body: undefined };
  res.setHeader = (k, v) => {
    res.headers[k] = v;
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  res.end = () => res;
  return res;
};
