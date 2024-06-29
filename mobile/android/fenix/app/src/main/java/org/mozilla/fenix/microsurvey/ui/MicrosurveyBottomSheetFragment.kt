/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.mozilla.fenix.microsurvey.ui

import android.app.Dialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.platform.rememberNestedScrollInteropConnection
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import org.mozilla.fenix.HomeActivity
import org.mozilla.fenix.R
import org.mozilla.fenix.ext.requireComponents
import org.mozilla.fenix.messaging.MicrosurveyMessageController
import org.mozilla.fenix.theme.FirefoxTheme

/**
 * todo pass question and icon values from messaging FXDROID-1945.
 * todo add dismiss request FXDROID-1946.
 */

/**
 * A bottom sheet fragment for displaying a microsurvey.
 */
class MicrosurveyBottomSheetFragment : BottomSheetDialogFragment() {

    private val microsurveyMessageController by lazy {
        MicrosurveyMessageController(requireComponents.appStore, (activity as HomeActivity))
    }

    private val closeBottomSheet = { dismiss() }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog =
        super.onCreateDialog(savedInstanceState).apply {
            setOnShowListener {
                val bottomSheet = findViewById<View?>(R.id.design_bottom_sheet)
                bottomSheet?.setBackgroundResource(android.R.color.transparent)
                val behavior = BottomSheetBehavior.from(bottomSheet)
                behavior.setPeekHeightToHalfScreenHeight()
                behavior.state = BottomSheetBehavior.STATE_HALF_EXPANDED
            }
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = ComposeView(requireContext()).apply {
        val answers = listOf(
            getString(R.string.likert_scale_option_1),
            getString(R.string.likert_scale_option_2),
            getString(R.string.likert_scale_option_3),
            getString(R.string.likert_scale_option_4),
            getString(R.string.likert_scale_option_5),
            getString(R.string.likert_scale_option_6),
        )

        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)

        setContent {
            FirefoxTheme {
                MicrosurveyBottomSheet(
                    question = "How satisfied are you with printing in Firefox?", // todo get value from messaging
                    icon = R.drawable.ic_print, // todo get value from messaging
                    answers = answers, // todo get value from messaging
                    onPrivacyPolicyLinkClick = {
                        closeBottomSheet
                        // todo get value from messaging
                        microsurveyMessageController.onPrivacyPolicyLinkClicked("homepage")
                    },
                    modifier = Modifier.nestedScroll(rememberNestedScrollInteropConnection()),
                )
            }
        }
    }

    private fun BottomSheetBehavior<View>.setPeekHeightToHalfScreenHeight() {
        peekHeight = resources.displayMetrics.heightPixels / 2
    }
}
