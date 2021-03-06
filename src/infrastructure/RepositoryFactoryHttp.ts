/*
 * Copyright 2019 NEM
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Observable, of as observableOf } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { NetworkType } from '../model/network/NetworkType';
import { AccountHttp } from './AccountHttp';
import { AccountRepository } from './AccountRepository';
import { BlockHttp } from './BlockHttp';
import { BlockRepository } from './BlockRepository';
import { ChainHttp } from './ChainHttp';
import { ChainRepository } from './ChainRepository';
import { IListener } from './IListener';
import { Listener } from './Listener';
import { MetadataHttp } from './MetadataHttp';
import { MetadataRepository } from './MetadataRepository';
import { MosaicHttp } from './MosaicHttp';
import { MosaicRepository } from './MosaicRepository';
import { MultisigHttp } from './MultisigHttp';
import { MultisigRepository } from './MultisigRepository';
import { NamespaceHttp } from './NamespaceHttp';
import { NamespaceRepository } from './NamespaceRepository';
import { NetworkHttp } from './NetworkHttp';
import { NetworkRepository } from './NetworkRepository';
import { NodeHttp } from './NodeHttp';
import { NodeRepository } from './NodeRepository';
import { ReceiptHttp } from './ReceiptHttp';
import { ReceiptRepository } from './ReceiptRepository';
import { RepositoryFactory } from './RepositoryFactory';
import { RepositoryFactoryConfig } from './RepositoryFactoryConfig';
import { RestrictionAccountHttp } from './RestrictionAccountHttp';
import { RestrictionAccountRepository } from './RestrictionAccountRepository';
import { RestrictionMosaicHttp } from './RestrictionMosaicHttp';
import { RestrictionMosaicRepository } from './RestrictionMosaicRepository';
import { TransactionHttp } from './TransactionHttp';
import { TransactionRepository } from './TransactionRepository';
import { TransactionStatusHttp } from './TransactionStatusHttp';
import { TransactionStatusRepository } from './TransactionStatusRepository';
import { HashLockRepository } from './HashLockRepository';
import { SecretLockRepository } from './SecretLockRepository';
import { SecretLockHttp } from './SecretLockHttp';
import { HashLockHttp } from './HashLockHttp';
import { DtoMapping } from '../core/utils/DtoMapping';
/**
 * Receipt http repository.
 *
 */
export class RepositoryFactoryHttp implements RepositoryFactory {
    private readonly url: string;
    private readonly networkType: Observable<NetworkType>;
    private readonly generationHash: Observable<string>;
    private readonly websocketUrl: string;
    private readonly websocketInjected?: any;
    private readonly fetchApi?: any;
    private readonly epochAdjustment: Observable<number>;

    /**
     * Constructor
     * @param url the server url.
     * @param configs optional repository factory configs
     */
    constructor(url: string, configs?: RepositoryFactoryConfig) {
        const networkRepo = this.createNetworkRepository();
        this.url = url;
        this.fetchApi = configs?.fetchApi;
        this.networkType = configs?.networkType ? observableOf(configs.networkType) : networkRepo.getNetworkType().pipe(shareReplay(1));
        this.epochAdjustment = configs?.epochAdjustment
            ? observableOf(configs.epochAdjustment)
            : networkRepo
                  .getNetworkProperties()
                  .pipe(
                      map((property) => {
                          return DtoMapping.parseServerDuration(property.network.epochAdjustment ?? '-').seconds();
                      }),
                  )
                  .pipe(shareReplay(1));
        this.generationHash = configs?.generationHash
            ? observableOf(configs?.generationHash)
            : this.createNodeRepository()
                  .getNodeInfo()
                  .pipe(map((b) => b.networkGenerationHashSeed))
                  .pipe(shareReplay(1));
        this.websocketUrl = configs?.websocketUrl ? configs?.websocketUrl : `${url.replace(/\/$/, '')}/ws`;
        this.websocketInjected = configs?.websocketInjected;
    }

    createAccountRepository(): AccountRepository {
        return new AccountHttp(this.url, this.fetchApi);
    }

    createBlockRepository(): BlockRepository {
        return new BlockHttp(this.url, this.fetchApi);
    }

    createChainRepository(): ChainRepository {
        return new ChainHttp(this.url, this.fetchApi);
    }

    createMetadataRepository(): MetadataRepository {
        return new MetadataHttp(this.url, this.fetchApi);
    }

    createMosaicRepository(): MosaicRepository {
        return new MosaicHttp(this.url, this.networkType, this.fetchApi);
    }

    createMultisigRepository(): MultisigRepository {
        return new MultisigHttp(this.url, this.fetchApi);
    }

    createNamespaceRepository(): NamespaceRepository {
        return new NamespaceHttp(this.url, this.networkType, this.fetchApi);
    }

    createNetworkRepository(): NetworkRepository {
        return new NetworkHttp(this.url, this.fetchApi);
    }

    createNodeRepository(): NodeRepository {
        return new NodeHttp(this.url, this.fetchApi);
    }

    createReceiptRepository(): ReceiptRepository {
        return new ReceiptHttp(this.url, this.fetchApi);
    }

    createRestrictionAccountRepository(): RestrictionAccountRepository {
        return new RestrictionAccountHttp(this.url, this.fetchApi);
    }

    createRestrictionMosaicRepository(): RestrictionMosaicRepository {
        return new RestrictionMosaicHttp(this.url, this.fetchApi);
    }

    createTransactionRepository(): TransactionRepository {
        return new TransactionHttp(this.url, this.fetchApi);
    }

    createTransactionStatusRepository(): TransactionStatusRepository {
        return new TransactionStatusHttp(this.url, this.fetchApi);
    }

    createHashLockRepository(): HashLockRepository {
        return new HashLockHttp(this.url, this.fetchApi);
    }

    createSecretLockRepository(): SecretLockRepository {
        return new SecretLockHttp(this.url, this.fetchApi);
    }

    getGenerationHash(): Observable<string> {
        return this.generationHash;
    }

    getNetworkType(): Observable<NetworkType> {
        return this.networkType;
    }

    createListener(): IListener {
        return new Listener(this.websocketUrl, this.createNamespaceRepository(), this.websocketInjected);
    }

    getEpochAdjustment(): Observable<number> {
        return this.epochAdjustment;
    }
}
