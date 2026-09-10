# Generate with Cohub

Support image generation and editing, video, speech, and music as provided by the selected model. Do not assume every generation request is an image request.

## Select the Model and Inputs

```bash
cohub models ls --model-type multimodal --json
cohub models show <model> --json
```

- Find models in the live list, then inspect their inputs, roles, parameters, defaults, and pricing. Do not hardcode model names from memory or use the LLM list as the generation-model list.
- Preserve the user's explicitly selected model when available. Otherwise choose by output type, reference media, quality, and cost. Ask briefly when cost differences are significant and preferences are unclear. If pricing is unavailable, say the cost cannot be estimated; do not claim it is free.
- Use the requested quantity, duration, and resolution. When unspecified, use reasonable model defaults rather than automatically running model comparisons or batch generation.
- Local reference files must be readable; reference URLs must be supported by the model. Sending private material to an external generation service requires appropriate authorization. Do not upload it publicly to bypass reference-access restrictions.
- Pass media with `--image`, `--video`, or `--audio`. Add `first_frame=`, `last_frame=`, `reference_image=`, or `reference_video=` only when supported by the model schema. Examples do not imply universal role support.

## Submit

Replace placeholders with the current model and actual inputs. Select the Space using the entry point's shared rules.

```bash
# Text-driven generation, returning the result directly
cohub generate "<prompt>" --model <model> --json

# Image editing, saving the result for a local project
cohub generate "<edit instruction>" --model <model> --image ./input.png --output ./assets/result.png --json

# When the model supports first-frame video
cohub generate "<motion prompt>" --model <model> --image first_frame=./input.png --async --json

# When the model supports an audio reference
cohub generate "<prompt>" --model <model> --audio ./reference.wav --async --json
```

There is no universal required-parameter template for speech or music; consult `models show`. Supply extra parameters with `--param key=value` or `--parameters '<json>'`, and model-required metadata with `--meta '<json>'`. Do not copy unchecked example parameters to another model.

## Long Tasks and Duplicate Charges

- Prefer `--async --json` for long tasks such as video, and save the returned `taskRunId` immediately. Async submission does not automatically download the result even if `--output` is also supplied.
- Query the original task with `cohub tasks get <taskRunId> --json`, waiting reasonably between checks. Queued or running is not complete; avoid tight polling.
- A synchronous call can limit waiting with `--timeout-ms`, but a wait timeout does not mean generation failed. Continue inspecting the original task when its ID is known. If the ID is missing or the response is lost, report uncertain submission status instead of immediately resubmitting.
- Distinguish generation, download, and validation failures. If generation succeeded but download failed, retry only the download. Confirm before a retry that incurs another charge; do not automatically change models, reduce specifications, or increase attempts.

## Retrieve and Deliver

- If only the generated result is requested, return its actual link; images may be previewed inline.
- For local project use, use `--output` for synchronous generation. After async completion, obtain files from actual result fields and download them to an appropriate project asset directory. Avoid existing paths rather than overwriting user assets.
- Open, inspect, or play the result as appropriate. Verify valid content, quantity, duration, and other key requirements; HTTP 200 or a file extension does not prove correctness. State which aspects remain unverified when inspection tools are unavailable.
- To publish a page afterward, integrate the assets locally and check the page before following [Publish](publish.md). A service-hosted generation result is not authorization to publish the entire project.

Deliver actual results and necessary task IDs. While a task is running, report only real progress, without placeholder links or invented charges.
