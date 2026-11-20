const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../core.js');
const base={id:'1',type:'expense',amount:1000,merchant:'가게',date:'2026-02-28',time:'12:30',category:'식비',memo:''};
test('달력에 없는 날짜와 잘못된 시간 및 금액을 거부한다',()=>{
 assert.equal(core.validRecord(base),true);
 for(const patch of [{date:'2026-02-30'},{date:'2026-13-01'},{time:'27:00'},{amount:1.5},{amount:1e13},{merchant:'  '}] ) assert.equal(core.validRecord({...base,...patch}),false,JSON.stringify(patch));
});
test('가져오는 파일 내부와 기존 내역의 중복 ID를 건너뛴다',()=>{
 const got=core.mergeRecords([base],[base,{...base,id:'2'},{...base,id:'2'}]);
 assert.equal(got.added,1);assert.equal(got.records.length,2);
});
test('백업의 형식과 중복 ID를 복원 전에 확인한다',()=>{
 assert.equal(core.validBackup({version:1,records:[base],settings:{budgets:{},recurring:[]}}),true);
 assert.equal(core.validBackup({version:1,records:[base,base],settings:{budgets:{}}}),false);
 assert.equal(core.validBackup({version:1,records:[base],settings:{budgets:null}}),false);
});
test('반복 기록은 매월 마지막 날짜에 맞추고 삭제한 회차는 다시 만들지 않는다',()=>{
 const rule={id:'r',merchant:'구독',amount:5000,day:31,start:'2026-01-01',category:'구독'};
 const list=core.recurringDue([rule],[],['r:2026-02'],'2026-03-31',()=>Math.random().toString());
 assert.deepEqual(list.map(x=>x.date),['2026-01-31','2026-03-31']);
});
test('월별 카테고리 비교는 전월이 0일 때 증가율을 만들지 않는다',()=>{
 const result=core.categoryComparison([base],[],['식비','교통']);
 assert.deepEqual(result[0],{category:'식비',current:1000,previous:0,difference:1000,percent:null});
});

test('백업 설정이 손상된 경우 복원하지 않는다',()=>{
 const settings={budgets:{},skippedRecurring:17};
 assert.equal(core.validBackup({version:1,records:[base],settings}),false);
});

test('저축 목표의 이름, 금액, 날짜가 유효해야 한다',()=>{
 const goal={id:'g',name:'여행 자금',target:100000,saved:25000,deadline:'2027-03-31'};
 assert.equal(core.validGoal(goal),true);
 for(const patch of [{name:' '},{target:0},{saved:-1},{target:1.5},{deadline:'2027-02-30'}])assert.equal(core.validGoal({...goal,...patch}),false);
 assert.equal(core.validBackup({version:1,records:[base],settings:{budgets:{},goals:[goal]}}),true);
 assert.equal(core.validBackup({version:1,records:[base],settings:{budgets:{},goals:[goal,goal]}}),false);
});
