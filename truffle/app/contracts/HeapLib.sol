pragma solidity ^0.4.21;

library HeapLib {
    struct Heap {
        uint256[] data;
    }

    function add(Heap storage heap, uint256 value) internal {
        heap.data.length += 1;
        uint index = heap.data.length - 1;
        heap.data[index] = value;

        while (index != 0 && heap.data[index] < heap.data[(index - 1) / 2]) {
            uint256 temp = heap.data[index];
            heap.data[index] = heap.data[(index - 1) / 2];
            heap.data[(index - 1) / 2] = temp;
            index = (index - 1) / 2;
        }
    }

    function peek(Heap storage _heap) view internal returns (uint256 value) {
        return _heap.data[0];
    }

    function pop(Heap storage heap) internal returns (uint256 value) {
        uint256 root = heap.data[0];
        heap.data[0] = heap.data[heap.data.length - 1];
        heap.data.length -= 1;
        heapify(heap, 0);
        return root;
    }

    function heapify(Heap storage heap, uint i) internal {
        uint left = 2 * i + 1;
        uint right = 2 * i + 2;
        uint smallest = i;
        if (left < heap.data.length && heap.data[left] < heap.data[i]) {
            smallest = left;
        }
        if (right < heap.data.length && heap.data[right] < heap.data[smallest]) {
            smallest = right;
        }
        if (smallest != i) {
            uint256 temp = heap.data[i];
            heap.data[i] = heap.data[smallest];
            heap.data[smallest] = temp;
            heapify(heap, smallest);
        }
    }

}