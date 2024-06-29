/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "ValidationError.h"
#include "mozilla/dom/WebGPUBinding.h"

namespace mozilla::webgpu {

GPU_IMPL_JS_WRAP(ValidationError)

already_AddRefed<ValidationError> ValidationError::Constructor(
    const dom::GlobalObject& aGlobal, const nsAString& aString,
    ErrorResult& aRv) {
  nsCOMPtr<nsIGlobalObject> global = do_QueryInterface(aGlobal.GetAsSupports());
  MOZ_RELEASE_ASSERT(global);
  return MakeAndAddRef<ValidationError>(global, aString);
}

}  // namespace mozilla::webgpu
