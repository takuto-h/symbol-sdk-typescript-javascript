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

import { Duration } from '@js-joda/core';
import { Address } from '../../model/account/Address';
import { MosaicId } from '../../model/mosaic/MosaicId';
import { AccountRestriction } from '../../model/restriction/AccountRestriction';
import { AccountRestrictions } from '../../model/restriction/AccountRestrictions';
import { AccountRestrictionsInfo } from '../../model/restriction/AccountRestrictionsInfo';
import { AddressRestrictionFlag } from '../../model/restriction/AddressRestrictionFlag';
import { MosaicRestrictionFlag } from '../../model/restriction/MosaicRestrictionFlag';
import { OperationRestrictionFlag } from '../../model/restriction/OperationRestrictionFlag';

export class DtoMapping {
    /**
     * Create AccountRestrictionsInfo class from Json.
     * @param {object} dataJson The account restriction json object.
     * @returns {module: model/Account/AccountRestrictionsInfo} The AccountRestrictionsInfo class.
     */
    public static extractAccountRestrictionFromDto(accountRestrictions): AccountRestrictionsInfo {
        return new AccountRestrictionsInfo(
            accountRestrictions.meta,
            new AccountRestrictions(
                Address.createFromEncoded(accountRestrictions.accountRestrictions.address),
                accountRestrictions.accountRestrictions.restrictions.map((prop) => {
                    switch (prop.restrictionFlags) {
                        case AddressRestrictionFlag.AllowIncomingAddress:
                        case AddressRestrictionFlag.BlockIncomingAddress:
                        case AddressRestrictionFlag.AllowOutgoingAddress:
                        case AddressRestrictionFlag.BlockOutgoingAddress:
                            return new AccountRestriction(
                                prop.restrictionFlags,
                                prop.values.map((value) => Address.createFromEncoded(value)),
                            );
                        case MosaicRestrictionFlag.AllowMosaic:
                        case MosaicRestrictionFlag.BlockMosaic:
                            return new AccountRestriction(
                                prop.restrictionFlags,
                                prop.values.map((value) => new MosaicId(value)),
                            );
                        case OperationRestrictionFlag.AllowOutgoingTransactionType:
                        case OperationRestrictionFlag.BlockOutgoingTransactionType:
                            return new AccountRestriction(prop.restrictionFlags, prop.values);
                        default:
                            throw new Error(`Invalid restriction type: ${prop.restrictionFlags}`);
                    }
                }),
            ),
        );
    }

    /**
     * Creates a copy of the first object adding the attributes of the second object.
     * @param object the object to be cloned
     * @param attributes the extra attributes to be added to the object.
     * @returns a copy of the first object with the new attributes added.
     */
    public static assign<T>(object: T, attributes: any): T {
        return Object.assign({ __proto__: Object.getPrototypeOf(object) }, object, attributes);
    }

    /**
     * Map one enum type to another by value
     * @param value enum value to be mapped
     */
    public static mapEnum<E1, E2>(value: E1 | undefined): E2 {
        return (value as unknown) as E2;
    }

    /**
     * It parse a server time/duration configuration like: - 1000ms 1000 milliseconds - 15s 15 seconds
     * - 5m 5 minutes - 2h 2 hours - 10d 10 days
     *
     * <p>into a @{@link Duration} object
     *
     * @param serverValue time.
     * @return {Duration} an instant from that value.
     */
    public static parseServerDuration(serverValue: string): Duration {
        const preprocessedValue = serverValue.replace(`'`, '').trim();
        const regex = `([0-9]+)([hdms]+)[:\\s]?$`;
        let duration = Duration.ofSeconds(0);
        const matcher = preprocessedValue.match(regex);
        if (matcher && matcher.length === 3) {
            const num = parseInt(matcher[1]);
            const type = matcher[2];
            switch (type) {
                case 'ms':
                    duration = duration.plusMillis(num);
                    break;
                case 's':
                    duration = duration.plusSeconds(num);
                    break;
                case 'm':
                    duration = duration.plusMinutes(num);
                    break;
                case 'h':
                    duration = duration.plusHours(num);
                    break;
                case 'd':
                    duration = duration.plusDays(num);
                    break;
                default:
                    throw new Error('Duration value format is not recognized.');
            }
            return duration;
        }
        throw new Error(`Duration value format is not recognized.`);
    }
}
