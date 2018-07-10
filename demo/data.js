module.exports = {
    persons: [
        {
            name: '孙俪',
            id: 1,
            relatives: [
                {
                    id: 2,
                    name: '邓超',
                    relation: '夫妻'
                },
                {
                    id: 3,
                    name: '黄晓明',
                    relation: '好友'
                },
                {
                    id: 4,
                    name: '佟大为',
                    relation: '好友'
                }
            ]
        }, 
        {
            name: '邓超',
            id: 2,
            relatives: [
                {
                    name: '郑凯',
                    id: 5,
                    relation: '好友'
                },
                {
                    name: '杨颖',
                    id: 6,
                    relation: '好友'
                },
                {
                    name: '孙俪',
                    id: 1,
                    relation: '夫妻'
                },
                {
                    name: '李晨',
                    id: 7,
                    relation: '好友'
                }
            ]
        },
        {
            id: 3,
            name: '黄晓明',
            relatives: [
                {
                    name: '杨颖',
                    id: 6,
                    relation: '夫妻'
                },
                {
                    name: '胡可',
                    id: 8,
                    relation: '前女友'
                },
                {
                    name: '赵薇',
                    id: 9,
                    relation: '同学'
                }
            ]
        },
        {
            id: 4,
            name: '佟大为',
            relatives: []
        },
        {
            id: 5,
            name: '郑凯',
            relatives: [
                {
                    name: '邓超',
                    id: 2,
                    relation: '好友'
                },
                {
                    name: '杨颖',
                    id: 6,
                    relation: '搭档'
                }
            ]
        },
        {
            id: 6,
            name: '杨颖',
            relatives: [
                {
                    name: '黄晓明',
                    id: 3,
                    relation: '夫妻'
                },
                {
                    name: '郑凯',
                    id: 5,
                    relation: '搭档'
                },
                {
                    name: '邓超',
                    id: 2,
                    relation: '好友'
                }
            ]
        },
        {
            id: 7,
            name: '李晨',
            relatives: [
                {
                    id: 11,
                    name: '范冰冰',
                    relation: '恋人'
                }
            ]
        },
        {
            id: 8,
            name: '胡可',
            relatives: [
                {
                    name: '黄晓明',
                    id: 3,
                    relation: '前男友'
                },
                {
                    name: '沙溢',
                    id: 10,
                    relation: '夫妻'
                }
            ]
        },
        {
            id: 9,
            name: '赵薇',
            relatives: [
                {
                    name: '范冰冰',
                    id: 11,
                    relation: '好友'
                },
                {
                    name: '黄晓明',
                    id: 3,
                    relation: '同学'
                }
            ]
        },
        {
            id: 10,
            name: '沙溢',
            relatives: [

            ]
        },
        {
            id: 11,
            name: '范冰冰',
            relatives: [
                {
                    name: '李晨',
                    id: 7,
                    relation: '恋人'
                },
                {
                    name: '赵薇',
                    id: 9,
                    relation: '好友'
                }
            ]
        }
    ]
}