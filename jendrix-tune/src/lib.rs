// JENDRIX-TUNE: Real-time Vocal Pitch Correction Plugin
// A web-based Auto-Tune-like effect using Hyperware + Web Audio API
//
// Architecture:
// - Frontend: Web Audio API for real-time audio processing in browser
// - Backend: Rust state management and parameter persistence
// - Processing: AudioWorklet nodes for pitch detection and correction

// CRITICAL IMPORTS
use hyperprocess_macro::hyperprocess;
use hyperware_process_lib::{homepage::add_to_homepage, our, println};
use serde::{Deserialize, Serialize};

const ICON: &str = include_str!("./icon");

// =============================================================================
// AUDIO PARAMETER TYPES
// =============================================================================

/// Musical key (root note) for pitch correction
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum Key {
    C,
    CSharp,
    D,
    DSharp,
    E,
    F,
    FSharp,
    G,
    GSharp,
    A,
    ASharp,
    B,
}

impl Default for Key {
    fn default() -> Self {
        Key::C
    }
}

/// Scale type (major or minor)
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum Scale {
    Major,
    Minor,
}

impl Default for Scale {
    fn default() -> Self {
        Scale::Major
    }
}

// =============================================================================
// APP STATE
// =============================================================================

/// Main application state holding all pitch correction parameters
/// These parameters are persisted and synchronized with the frontend
#[derive(Default, Serialize, Deserialize)]
pub struct AppState {
    /// Musical key for pitch correction (C, C#, D, etc.)
    key: Key,

    /// Scale type (Major or Minor)
    scale: Scale,

    /// Retune speed: 0.0 (instant/robotic) to 1.0 (slow/natural)
    /// Controls how quickly pitch snaps to the target note
    retune_speed: f32,

    /// Humanize amount: 0.0 (perfect tuning) to 1.0 (allow natural vibrato)
    /// Adds subtle pitch variations to sound more natural
    humanize: f32,

    /// Wet/Dry mix: 0.0 (100% dry) to 1.0 (100% wet)
    mix: f32,

    /// Formant preservation enabled (preserves vocal character during pitch shift)
    formant_preserve: bool,

    /// Audio bypass (pass-through without processing)
    bypass: bool,
}

/// Status response for frontend queries
#[derive(Default, Serialize, Deserialize, Debug)]
pub struct Status {
    key: Key,
    scale: Scale,
    retune_speed: f32,
    humanize: f32,
    mix: f32,
    formant_preserve: bool,
    bypass: bool,
    node: String,
}

// =============================================================================
// HYPERPROCESS IMPLEMENTATION
// =============================================================================

#[hyperprocess(
    name = "Jendrix Tune",
    ui = Some(hyperware_process_lib::http::server::HttpBindingConfig::default()),
    endpoints = vec![
        hyperware_process_lib::hyperapp::Binding::Http {
            path: "/api",
            config: hyperware_process_lib::http::server::HttpBindingConfig::new(false, false, false, None),
        },
    ],
    save_config = hyperware_process_lib::hyperapp::SaveOptions::OnDiff,
    wit_world = "jendrix-tune-template-dot-os-v0"
)]
impl AppState {
    /// Initialize the pitch correction app with sensible defaults
    #[init]
    async fn initialize(&mut self) {
        // Register with Hyperware homepage
        add_to_homepage("Jendrix Tune", Some(ICON), Some("/"), None);

        // Initialize pitch correction parameters with musical defaults
        self.key = Key::C;
        self.scale = Scale::Major;
        self.retune_speed = 0.5; // Medium speed (balanced)
        self.humanize = 0.1; // Slight natural variation
        self.mix = 1.0; // 100% wet (full effect)
        self.formant_preserve = true; // Preserve vocal character
        self.bypass = false; // Effect enabled

        println!(
            "🎵 Jendrix Tune initialized on node: {} | Key: {:?} {} | Retune: {:.1}",
            our().node.clone(),
            self.key,
            match self.scale {
                Scale::Major => "Major",
                Scale::Minor => "Minor",
            },
            self.retune_speed
        );
    }

    // =========================================================================
    // QUERY ENDPOINTS (read-only state)
    // =========================================================================

    /// Get current pitch correction status and all parameters
    #[local]
    #[http]
    async fn get_status(&self) -> Result<Status, String> {
        Ok(Status {
            key: self.key.clone(),
            scale: self.scale.clone(),
            retune_speed: self.retune_speed,
            humanize: self.humanize,
            mix: self.mix,
            formant_preserve: self.formant_preserve,
            bypass: self.bypass,
            node: our().node.clone(),
        })
    }

    // =========================================================================
    // PARAMETER UPDATE ENDPOINTS (mutations)
    // =========================================================================

    /// Set the musical key for pitch correction
    /// Example: { "set_key": "C" } or { "set_key": "FSharp" }
    #[local]
    #[http]
    async fn set_key(&mut self, key: Key) -> Result<(), String> {
        self.key = key.clone();
        println!("🎵 Key changed to: {:?}", key);
        Ok(())
    }

    /// Set the scale type (Major or Minor)
    #[local]
    #[http]
    async fn set_scale(&mut self, scale: Scale) -> Result<(), String> {
        self.scale = scale.clone();
        println!(
            "🎵 Scale changed to: {:?} {:?}",
            self.key, self.scale
        );
        Ok(())
    }

    /// Set retune speed (0.0 = instant/robotic, 1.0 = slow/natural)
    #[local]
    #[http]
    async fn set_retune_speed(&mut self, speed: f32) -> Result<(), String> {
        self.retune_speed = speed.clamp(0.0, 1.0);
        println!("🎵 Retune speed: {:.2}", self.retune_speed);
        Ok(())
    }

    /// Set humanize amount (0.0 = perfect tuning, 1.0 = natural vibrato)
    #[local]
    #[http]
    async fn set_humanize(&mut self, amount: f32) -> Result<(), String> {
        self.humanize = amount.clamp(0.0, 1.0);
        println!("🎵 Humanize: {:.2}", self.humanize);
        Ok(())
    }

    /// Set wet/dry mix (0.0 = 100% dry, 1.0 = 100% wet)
    #[local]
    #[http]
    async fn set_mix(&mut self, mix: f32) -> Result<(), String> {
        self.mix = mix.clamp(0.0, 1.0);
        println!("🎵 Mix: {:.1}% wet", self.mix * 100.0);
        Ok(())
    }

    /// Toggle formant preservation
    #[local]
    #[http]
    async fn set_formant_preserve(&mut self, enabled: bool) -> Result<(), String> {
        self.formant_preserve = enabled;
        println!(
            "🎵 Formant preserve: {}",
            if enabled { "ON" } else { "OFF" }
        );
        Ok(())
    }

    /// Toggle bypass (true = pass-through, false = processing enabled)
    #[local]
    #[http]
    async fn set_bypass(&mut self, bypass: bool) -> Result<(), String> {
        self.bypass = bypass;
        println!("🎵 Bypass: {}", if bypass { "ON" } else { "OFF" });
        Ok(())
    }

    /// Bulk update all parameters at once
    #[local]
    #[http]
    async fn update_all_params(
        &mut self,
        params: (Key, Scale, f32, f32, f32, bool, bool),
    ) -> Result<(), String> {
        let (key, scale, retune_speed, humanize, mix, formant_preserve, bypass) = params;

        self.key = key;
        self.scale = scale;
        self.retune_speed = retune_speed.clamp(0.0, 1.0);
        self.humanize = humanize.clamp(0.0, 1.0);
        self.mix = mix.clamp(0.0, 1.0);
        self.formant_preserve = formant_preserve;
        self.bypass = bypass;

        println!("🎵 All parameters updated");
        Ok(())
    }
}

// =============================================================================
// MUSICAL REFERENCE
// =============================================================================
//
// Major Scale Intervals (semitones from root): [0, 2, 4, 5, 7, 9, 11]
// Minor Scale Intervals (semitones from root): [0, 2, 3, 5, 7, 8, 10]
//
// Key mappings (MIDI note numbers for middle octave):
// C=60, C#=61, D=62, D#=63, E=64, F=65, F#=66, G=67, G#=68, A=69, A#=70, B=71
//
// =============================================================================
// DEVELOPMENT WORKFLOW
// =============================================================================
//
// 1. Backend first: Define state and HTTP endpoints in lib.rs (this file)
// 2. Build: Run `kit build --hyperapp` to generate API bindings
// 3. Frontend: Use generated types in ui/src/ to build React UI
// 4. Test: Run `kit s` and access at http://localhost:8080
//
// Audio Processing Pipeline (in browser):
// Microphone → AudioContext → PitchDetector → PitchCorrector → Output
//                                  ↓                  ↓
//                            (YIN algorithm)   (Phase vocoder)
//
// =============================================================================
