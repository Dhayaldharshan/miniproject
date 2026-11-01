const fs = require('fs');
const path = require('path');

const dmsPath = path.join(__dirname, '..', 'src', 'com', 'crisissync', 'service', 'DisasterManagementService.java');
let content = fs.readFileSync(dmsPath, 'utf8');

content = content.replace(
    `        // Deduct from stock\n        if (foodKits > 0) stock.deductFood(foodKits);\n        if (medicalKits > 0) stock.deductMedicine(medicalKits);`,
    `        // Deduct from stock\n        if (foodKits > 0) stock.allocateFoodKits(foodKits);\n        if (medicalKits > 0) stock.allocateMedicineKits(medicalKits);`
);

content = content.replace(
    `        // Deduct from stock\r\n        if (foodKits > 0) stock.deductFood(foodKits);\r\n        if (medicalKits > 0) stock.deductMedicine(medicalKits);`,
    `        // Deduct from stock\r\n        if (foodKits > 0) stock.allocateFoodKits(foodKits);\r\n        if (medicalKits > 0) stock.allocateMedicineKits(medicalKits);`
);

content = content.replace(
    `re.setFoodAllocated(re.getFoodAllocated() != null ? re.getFoodAllocated() + finalFoodKits : finalFoodKits);`,
    `re.setFoodAllocated(re.getFoodAllocated() + finalFoodKits);`
);

content = content.replace(
    `re.setMedicineAllocated(re.getMedicineAllocated() != null ? re.getMedicineAllocated() + finalMedKits : finalMedKits);`,
    `re.setMedicineAllocated(re.getMedicineAllocated() + finalMedKits);`
);

content = content.replace(
    `            rescueReq.setStatus("IN_PROGRESS");\n            rescueReq.addAssignedTeam(team);`,
    `            rescueReq.setStatus("IN_PROGRESS");\n            rescueReq.setAssignedTeamId(teamId);`
);

content = content.replace(
    `            rescueReq.setStatus("IN_PROGRESS");\r\n            rescueReq.addAssignedTeam(team);`,
    `            rescueReq.setStatus("IN_PROGRESS");\r\n            rescueReq.setAssignedTeamId(teamId);`
);

fs.writeFileSync(dmsPath, content, 'utf8');
console.log('Fixed DMS methods!');

