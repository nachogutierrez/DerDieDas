export const LRUCache = function (capacity) {
    this.capacity = capacity;
    this.map = new Map(); // this stores the entire array

    // this is boundaries for double linked list
    this.head = {};
    this.tail = {};

    this.head.next = this.tail; // initialize your double linked list
    this.tail.prev = this.head;
};

LRUCache.prototype.get = function (key) {
    if (this.map.has(key)) {
        // remove elem from current position
        let c = this.map.get(key);
        c.prev.next = c.next;
        c.next.prev = c.prev;

        this.tail.prev.next = c; // insert it after last element. Element before tail
        c.prev = this.tail.prev; // update c.prev and next pointer
        c.next = this.tail;
        this.tail.prev = c; // update last element as tail

        return c.value;
    } else {
        return -1; // element does not exist
    }
};

LRUCache.prototype.put = function (key, value) {
    if (this.get(key) !== -1) {
        // if key does not exist, update last element value
        this.tail.prev.value = value;
    } else {
        // check if map size is at capacity
        if (this.map.size === this.capacity) {
            //delete item both from map and DLL
            this.map.delete(this.head.next.key); // delete first element of list
            this.head.next = this.head.next.next; // update first element as next element
            this.head.next.prev = this.head;
        }

        let newNode = {
            value,
            key,
        }; // each node is a hashtable that stores key and value

        // when adding a new node, we need to update both map and DLL
        this.map.set(key, newNode); // add current node to map
        this.tail.prev.next = newNode; // add node to end of the list
        newNode.prev = this.tail.prev; // update prev and next pointers of newNode
        newNode.next = this.tail;
        this.tail.prev = newNode; // update last element
    }
};

export function serialize(lru) {
    return JSON.stringify({
        capacity: lru.capacity,
        nodes: listNodes(lru.head)
    })
}

export function deserialize(serializedLru) {
    const obj = JSON.parse(serializedLru)
    const lru = new LRUCache(obj.capacity)
    for (let node of obj.nodes) {
        lru.put(node.key, node.value)
    }
    return lru
}

function listNodes(head) {
    let curr = head
    let nodes = []
    while (curr != undefined) {
        if (curr.key !== undefined && curr.value !== undefined) {
            nodes.push({
                key: curr.key,
                value: curr.value
            })
        }
        curr = curr.next
    }
    return nodes
}