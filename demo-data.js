window.ASSET_DEMO = (() => {
  const now = Date.now();
  const days = (n) => new Date(now + n * 86400000).toISOString();
  const ago = (n) => new Date(now - n * 86400000).toISOString();

  const people = [
    {id:1,name:"Alyssa Reyes",department:"Finance",email:"alyssa.reyes@contoso.local",location:"Main Office"},
    {id:2,name:"Marco Santos",department:"Operations",email:"marco.santos@contoso.local",location:"Main Office"},
    {id:3,name:"Nina Cruz",department:"Human Resources",email:"nina.cruz@contoso.local",location:"Main Office"},
    {id:4,name:"Daniel Lee",department:"Sales",email:"daniel.lee@contoso.local",location:"Branch Office"},
    {id:5,name:"Mika Torres",department:"Marketing",email:"mika.torres@contoso.local",location:"Main Office"},
    {id:10,name:"Jim Camus",department:"IT",email:"jim.camus@contoso.local",location:"Main Office"}
  ];

  const assets = [
    {id:1,tag:"AST-1001",hostname:"FIN-LT-014",type:"Laptop",serial:"LNV-83F4A2",status:"Assigned",owner_id:1,owner:"Alyssa Reyes",department:"Finance",location:"Main Office",purchase_date:"2025-01-16",warranty_expiry:days(118),updated_at:ago(.2),specs:{CPU:"Intel Core i5-1345U",RAM:"16 GB",Storage:"512 GB NVMe",OS:"Windows 11 Pro"}},
    {id:2,tag:"AST-1002",hostname:"OPS-DT-022",type:"Desktop",serial:"DEL-72D19B",status:"Assigned",owner_id:2,owner:"Marco Santos",department:"Operations",location:"Main Office",purchase_date:"2024-07-04",warranty_expiry:days(38),updated_at:ago(1),specs:{CPU:"Intel Core i7-12700",RAM:"16 GB",Storage:"1 TB SSD",OS:"Windows 11 Pro"}},
    {id:3,tag:"AST-1003",hostname:"HR-LT-008",type:"Laptop",serial:"HP-19A8D1",status:"Assigned",owner_id:3,owner:"Nina Cruz",department:"Human Resources",location:"Main Office",purchase_date:"2024-04-22",warranty_expiry:days(-12),updated_at:ago(2),specs:{CPU:"AMD Ryzen 7 7840U",RAM:"16 GB",Storage:"512 GB SSD",OS:"Windows 11 Pro"}},
    {id:4,tag:"AST-1004",hostname:"CORE-SW-01",type:"Switch",serial:"CSC-9200-01",status:"Assigned",owner_id:10,owner:"Jim Camus",department:"IT",location:"MDF",purchase_date:"2025-05-10",warranty_expiry:days(680),updated_at:ago(3),specs:{Model:"Cisco Catalyst 9200L",Ports:"48 x 1GbE",Uplink:"4 x 10GbE",OS:"Cisco IOS XE"}},
    {id:5,tag:"AST-1005",hostname:"AP-F2-03",type:"Access Point",serial:"UBQ-U6-003",status:"Assigned",owner_id:10,owner:"Jim Camus",department:"IT",location:"Floor 2",purchase_date:"2025-02-18",warranty_expiry:days(310),updated_at:ago(5),specs:{Model:"UniFi U6 Pro",Radio:"Wi-Fi 6",PoE:"802.3at",Controller:"UniFi"}},
    {id:6,tag:"AST-1006",hostname:"PRN-FIN-01",type:"Printer",serial:"HP-M428-11",status:"In Repair",owner_id:null,owner:"Unassigned",department:"Finance",location:"IT Repair Bench",purchase_date:"2023-09-11",warranty_expiry:days(-168),updated_at:ago(.4),specs:{Model:"HP LaserJet Pro M428",Network:"Ethernet",Duplex:"Automatic",Type:"Monochrome Laser"}},
    {id:7,tag:"AST-1007",hostname:"SRV-AD01",type:"Server",serial:"DEL-R550-01",status:"Assigned",owner_id:10,owner:"Jim Camus",department:"IT",location:"Server Room",purchase_date:"2024-11-03",warranty_expiry:days(420),updated_at:ago(4),specs:{CPU:"2 x Intel Xeon Silver",RAM:"128 GB",Storage:"RAID 10",OS:"Windows Server 2022"}},
    {id:8,tag:"AST-1008",hostname:"SPARE-LT-02",type:"Laptop",serial:"ACR-SWIFT-02",status:"Available",owner_id:null,owner:"Unassigned",department:"IT",location:"IT Stockroom",purchase_date:"2025-08-20",warranty_expiry:days(610),updated_at:ago(.1),specs:{CPU:"Intel Core Ultra 5",RAM:"16 GB",Storage:"512 GB SSD",OS:"Windows 11 Pro"}},
    {id:9,tag:"AST-1009",hostname:"SALES-LT-031",type:"Laptop",serial:"ASU-31C99F",status:"Assigned",owner_id:4,owner:"Daniel Lee",department:"Sales",location:"Branch Office",purchase_date:"2024-01-17",warranty_expiry:days(8),updated_at:ago(6),specs:{CPU:"Intel Core i5-1235U",RAM:"8 GB",Storage:"512 GB SSD",OS:"Windows 11 Pro"}},
    {id:10,tag:"AST-1010",hostname:"MKT-LT-012",type:"Laptop",serial:"LEN-12MKT9",status:"Assigned",owner_id:5,owner:"Mika Torres",department:"Marketing",location:"Main Office",purchase_date:"2025-03-02",warranty_expiry:days(350),updated_at:ago(2),specs:{CPU:"Intel Core i7-1360P",RAM:"16 GB",Storage:"1 TB SSD",OS:"Windows 11 Pro"}},
    {id:11,tag:"AST-1011",hostname:"MON-27-044",type:"Monitor",serial:"DEL-U2723-44",status:"Available",owner_id:null,owner:"Unassigned",department:"IT",location:"IT Stockroom",purchase_date:"2025-06-06",warranty_expiry:days(540),updated_at:ago(7),specs:{Size:"27 inch",Resolution:"2560x1440",Panel:"IPS",Input:"HDMI / DisplayPort"}},
    {id:12,tag:"AST-1012",hostname:"OLD-LT-004",type:"Laptop",serial:"HP-OLD004",status:"Retired",owner_id:null,owner:"Unassigned",department:"IT",location:"Disposal Cage",purchase_date:"2020-03-14",warranty_expiry:days(-920),updated_at:ago(19),specs:{CPU:"Intel Core i5-8265U",RAM:"8 GB",Storage:"256 GB SSD",OS:"Windows 10 Pro"}}
  ];

  const maintenance = [
    {id:1,asset_id:6,asset:"PRN-FIN-01",status:"Open",severity:"High",title:"Fuser assembly fault",vendor:"Internal IT",opened_at:ago(1),due_at:days(1),notes:"Printer reports hardware error after repeated paper jams."},
    {id:2,asset_id:3,asset:"HR-LT-008",status:"Completed",severity:"Medium",title:"Battery replacement",vendor:"Authorized service center",opened_at:ago(63),due_at:ago(58),completed_at:ago(59),notes:"Battery health had dropped below replacement threshold."},
    {id:3,asset_id:2,asset:"OPS-DT-022",status:"Scheduled",severity:"Low",title:"Preventive cleaning",vendor:"Internal IT",opened_at:ago(2),due_at:days(14),notes:"Quarterly preventive maintenance."},
    {id:4,asset_id:9,asset:"SALES-LT-031",status:"Open",severity:"Medium",title:"Intermittent charging",vendor:"Vendor warranty",opened_at:ago(.5),due_at:days(3),notes:"Charging disconnects when cable is moved."}
  ];

  const software = [
    {id:1,name:"Microsoft 365 Business Premium",vendor:"Microsoft",licenses:25,assigned:22,expiry:days(275),category:"Productivity"},
    {id:2,name:"Adobe Acrobat Pro",vendor:"Adobe",licenses:10,assigned:9,expiry:days(94),category:"Document"},
    {id:3,name:"Endpoint Security Suite",vendor:"Security Vendor",licenses:30,assigned:27,expiry:days(190),category:"Security"},
    {id:4,name:"Remote Support Agent",vendor:"Support Vendor",licenses:15,assigned:15,expiry:days(42),category:"IT Operations"},
    {id:5,name:"Network Monitoring",vendor:"Infrastructure Vendor",licenses:5,assigned:3,expiry:days(330),category:"Infrastructure"}
  ];

  const audit = [
    {id:1,at:ago(.1),actor:"Jim Camus",action:"Inventory update",detail:"AST-1008 status verified as Available.",asset_id:8},
    {id:2,at:ago(.4),actor:"Jim Camus",action:"Maintenance opened",detail:"AST-1006 moved to In Repair for fuser assembly fault.",asset_id:6},
    {id:3,at:ago(1),actor:"IT Operations",action:"Asset assigned",detail:"AST-1002 assigned to Marco Santos.",asset_id:2},
    {id:4,at:ago(2),actor:"Jim Camus",action:"Asset updated",detail:"AST-1003 warranty information reviewed.",asset_id:3},
    {id:5,at:ago(5),actor:"IT Operations",action:"Location updated",detail:"AST-1005 moved to Floor 2.",asset_id:5},
    {id:6,at:ago(19),actor:"Jim Camus",action:"Asset retired",detail:"AST-1012 retired and moved to Disposal Cage.",asset_id:12}
  ];

  return {generated_at:new Date(now).toISOString(),people,assets,maintenance,software,audit};
})();