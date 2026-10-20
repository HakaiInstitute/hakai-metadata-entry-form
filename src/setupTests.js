// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "regenerator-runtime/runtime";

import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { MessagePort, MessageChannel } from 'worker_threads';

Object.assign(global, { TextDecoder, TextEncoder, ReadableStream, WritableStream, TransformStream, MessagePort, MessageChannel });
