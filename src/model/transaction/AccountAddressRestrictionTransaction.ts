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

import {
    AccountAddressRestrictionTransactionBuilder,
    AmountDto,
    EmbeddedAccountAddressRestrictionTransactionBuilder,
    EmbeddedTransactionBuilder,
    KeyDto,
    SignatureDto,
    TimestampDto,
    UnresolvedAddressDto,
    TransactionBuilder,
} from 'catbuffer-typescript';
import { Convert } from '../../core/format';
import { DtoMapping } from '../../core/utils/DtoMapping';
import { UnresolvedMapping } from '../../core/utils/UnresolvedMapping';
import { Address } from '../account/Address';
import { PublicAccount } from '../account/PublicAccount';
import { NamespaceId } from '../namespace/NamespaceId';
import { NetworkType } from '../network/NetworkType';
import { Statement } from '../receipt/Statement';
import { UInt64 } from '../UInt64';
import { Deadline } from './Deadline';
import { InnerTransaction } from './InnerTransaction';
import { Transaction } from './Transaction';
import { TransactionInfo } from './TransactionInfo';
import { TransactionType } from './TransactionType';
import { TransactionVersion } from './TransactionVersion';
import { AddressRestrictionFlag } from '../restriction/AddressRestrictionFlag';
import { UnresolvedAddress } from '../account/UnresolvedAddress';

export class AccountAddressRestrictionTransaction extends Transaction {
    /**
     * Create a modify account address restriction transaction object
     * @param deadline - The deadline to include the transaction.
     * @param restrictionFlags - The account restriction flags.
     * @param restrictionAdditions - Account restriction additions.
     * @param restrictionDeletions - Account restriction deletions.
     * @param networkType - The network type.
     * @param maxFee - (Optional) Max fee defined by the sender
     * @param signature - (Optional) Transaction signature
     * @param signer - (Optional) Signer public account
     * @returns {AccountAddressRestrictionTransaction}
     */
    public static create(
        deadline: Deadline,
        restrictionFlags: AddressRestrictionFlag,
        restrictionAdditions: UnresolvedAddress[],
        restrictionDeletions: UnresolvedAddress[],
        networkType: NetworkType,
        maxFee: UInt64 = new UInt64([0, 0]),
        signature?: string,
        signer?: PublicAccount,
    ): AccountAddressRestrictionTransaction {
        return new AccountAddressRestrictionTransaction(
            networkType,
            TransactionVersion.ACCOUNT_ADDRESS_RESTRICTION,
            deadline,
            maxFee,
            restrictionFlags,
            restrictionAdditions,
            restrictionDeletions,
            signature,
            signer,
        );
    }

    /**
     * @param networkType
     * @param version
     * @param deadline
     * @param maxFee
     * @param restrictionFlags
     * @param restrictionAdditions
     * @param restrictionDeletions
     * @param signature
     * @param signer
     * @param transactionInfo
     */
    constructor(
        networkType: NetworkType,
        version: number,
        deadline: Deadline,
        maxFee: UInt64,
        public readonly restrictionFlags: AddressRestrictionFlag,
        public readonly restrictionAdditions: UnresolvedAddress[],
        public readonly restrictionDeletions: UnresolvedAddress[],
        signature?: string,
        signer?: PublicAccount,
        transactionInfo?: TransactionInfo,
    ) {
        super(TransactionType.ACCOUNT_ADDRESS_RESTRICTION, networkType, version, deadline, maxFee, signature, signer, transactionInfo);
    }

    /**
     * Create a transaction object from payload
     * @param {string} payload Binary payload
     * @param {Boolean} isEmbedded Is embedded transaction (Default: false)
     * @returns {Transaction | InnerTransaction}
     */
    public static createFromPayload(payload: string, isEmbedded = false): Transaction | InnerTransaction {
        const builder = isEmbedded
            ? EmbeddedAccountAddressRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload))
            : AccountAddressRestrictionTransactionBuilder.loadFromBinary(Convert.hexToUint8(payload));
        const signerPublicKey = Convert.uint8ToHex(builder.getSignerPublicKey().key);
        const networkType = builder.getNetwork().valueOf();
        const signature = payload.substring(16, 144);
        const transaction = AccountAddressRestrictionTransaction.create(
            isEmbedded
                ? Deadline.createEmtpy()
                : Deadline.createFromDTO((builder as AccountAddressRestrictionTransactionBuilder).getDeadline().timestamp),
            builder.getRestrictionFlags().valueOf(),
            builder.getRestrictionAdditions().map((addition) => {
                return UnresolvedMapping.toUnresolvedAddress(Convert.uint8ToHex(addition.unresolvedAddress));
            }),
            builder.getRestrictionDeletions().map((deletion) => {
                return UnresolvedMapping.toUnresolvedAddress(Convert.uint8ToHex(deletion.unresolvedAddress));
            }),
            networkType,
            isEmbedded ? new UInt64([0, 0]) : new UInt64((builder as AccountAddressRestrictionTransactionBuilder).fee.amount),
            isEmbedded || signature.match(`^[0]+$`) ? undefined : signature,
            signerPublicKey.match(`^[0]+$`) ? undefined : PublicAccount.createFromPublicKey(signerPublicKey, networkType),
        );
        return isEmbedded ? transaction.toAggregate(PublicAccount.createFromPublicKey(signerPublicKey, networkType)) : transaction;
    }

    /**
     * @internal
     * @returns {TransactionBuilder}
     */
    protected createBuilder(): TransactionBuilder {
        const signerBuffer = this.signer !== undefined ? Convert.hexToUint8(this.signer.publicKey) : new Uint8Array(32);
        const signatureBuffer = this.signature !== undefined ? Convert.hexToUint8(this.signature) : new Uint8Array(64);

        const transactionBuilder = new AccountAddressRestrictionTransactionBuilder(
            new SignatureDto(signatureBuffer),
            new KeyDto(signerBuffer),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.ACCOUNT_ADDRESS_RESTRICTION.valueOf(),
            new AmountDto(this.maxFee.toDTO()),
            new TimestampDto(this.deadline.toDTO()),
            this.restrictionFlags.valueOf(),
            this.restrictionAdditions.map((addition) => {
                return new UnresolvedAddressDto(addition.encodeUnresolvedAddress(this.networkType));
            }),
            this.restrictionDeletions.map((deletion) => {
                return new UnresolvedAddressDto(deletion.encodeUnresolvedAddress(this.networkType));
            }),
        );
        return transactionBuilder;
    }

    /**
     * @internal
     * @returns {EmbeddedTransactionBuilder}
     */
    public toEmbeddedTransaction(): EmbeddedTransactionBuilder {
        return new EmbeddedAccountAddressRestrictionTransactionBuilder(
            new KeyDto(Convert.hexToUint8(this.signer!.publicKey)),
            this.versionToDTO(),
            this.networkType.valueOf(),
            TransactionType.ACCOUNT_ADDRESS_RESTRICTION.valueOf(),
            this.restrictionFlags.valueOf(),
            this.restrictionAdditions.map((addition) => {
                return new UnresolvedAddressDto(addition.encodeUnresolvedAddress(this.networkType));
            }),
            this.restrictionDeletions.map((deletion) => {
                return new UnresolvedAddressDto(deletion.encodeUnresolvedAddress(this.networkType));
            }),
        );
    }

    /**
     * @internal
     * @param statement Block receipt statement
     * @param aggregateTransactionIndex Transaction index for aggregated transaction
     * @returns {AccountAddressRestrictionTransaction}
     */
    resolveAliases(statement: Statement, aggregateTransactionIndex = 0): AccountAddressRestrictionTransaction {
        const transactionInfo = this.checkTransactionHeightAndIndex();
        return DtoMapping.assign(this, {
            restrictionAdditions: this.restrictionAdditions.map((addition) =>
                statement.resolveAddress(addition, transactionInfo.height.toString(), transactionInfo.index, aggregateTransactionIndex),
            ),
            restrictionDeletions: this.restrictionDeletions.map((deletion) =>
                statement.resolveAddress(deletion, transactionInfo.height.toString(), transactionInfo.index, aggregateTransactionIndex),
            ),
        });
    }

    /**
     * @internal
     * Check a given address should be notified in websocket channels
     * @param address address to be notified
     * @param alias address alias (names)
     * @returns {boolean}
     */
    public shouldNotifyAccount(address: Address, alias: NamespaceId[]): boolean {
        return (
            super.isSigned(address) ||
            this.restrictionAdditions.find((_) => _.equals(address) || alias.find((a) => _.equals(a)) !== undefined) !== undefined ||
            this.restrictionDeletions.find((_) => _.equals(address) || alias.find((a) => _.equals(a)) !== undefined) !== undefined
        );
    }
}
