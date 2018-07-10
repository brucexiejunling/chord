require('../index');
const staticData = require('./data')
const doSearch = (key, val, cb) => {
    let result = staticData.persons.filter((item) => {
        return item[key] === val;
    });
    if (result && result[0]) {
        cb && cb(result[0]);
    }
}

const formatData = (data) => {
    let nodes = {},
        edges = {};
    let processor = (item) => {
        item.label = item.name;
        nodes[item.id] = Object.assign({}, item);
        edges[item.id] = {};
        item.relatives.forEach((it) => {
            it.label = it.name;
            nodes[it.id] = Object.assign({}, it);
            edges[item.id][it.id] = {
                label: it.relation
            };
        });
    }
    if (Object.prototype.toString.call(data).indexOf('Array') > -1) {
        data.forEach(processor);
    } else {
        processor(data);
    }
    return {
        nodes,
        edges
    };
}

Chord.init('#viewport', {
    data: {},
    onClickNode: (node) => {
        doSearch('id', node.id, (data) => {
            Chord.update(formatData(data));
        });
    }
});

window.onload = () => {
    document.getElementById('J_search').addEventListener('click', (e) => {
        let value = document.getElementById('J_input').value;
        if (!value) {
            return
        } else {
            doSearch('name', value, (data) => {
                setTimeout(() => {
                    Chord.repaint(formatData(data));
                }, 1000)
            });
        }
    })
}