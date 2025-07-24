"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFCModule = void 0;
const common_1 = require("@nestjs/common");
const nfc_controller_1 = require("./nfc.controller");
const nfc_service_1 = require("./nfc.service");
const crypto_module_1 = require("../crypto/crypto.module");
let NFCModule = class NFCModule {
};
exports.NFCModule = NFCModule;
exports.NFCModule = NFCModule = __decorate([
    (0, common_1.Module)({
        imports: [crypto_module_1.CryptoModule],
        controllers: [nfc_controller_1.NFCController],
        providers: [nfc_service_1.NFCService],
        exports: [nfc_service_1.NFCService],
    })
], NFCModule);
//# sourceMappingURL=nfc.module.js.map