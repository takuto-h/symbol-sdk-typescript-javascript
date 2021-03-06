/*
 * Copyright 2020 NEM
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

import { SearchCriteria } from './SearchCriteria';
import { MosaicId } from '../../model/mosaic/MosaicId';
import { AccountOrderBy } from './AccountOrderBy';

/**
 * Defines the params used to search blocks. With this criteria, you can sort and filter
 * block queries using rest.
 */
export interface AccountSearchCriteria extends SearchCriteria {
    /**
     * Account order by enum. (optional)
     */
    orderBy?: AccountOrderBy;

    /**
     * Account mosaic id. (optional)
     */
    mosaicId?: MosaicId;
}
