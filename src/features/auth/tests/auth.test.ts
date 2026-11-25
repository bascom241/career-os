import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../../../utils/password.ts";
import { createVerificationToken } from "../../../utils/createVerificationToken.ts";
import { verifyEmail, resetPassword } from "../service/auth.service.ts";
import User from "../model/user.model.ts";

test("password verification accepts the correct password and safely rejects malformed hashes", async () => {
    const hash = await hashPassword("correct password");
    assert.equal(await verifyPassword("correct password", hash), true);
    assert.equal(await verifyPassword("wrong password", hash), false);
    for (const malformed of ["", "salt:abcd", "a".repeat(32) + ":" + "z".repeat(128)]) {
        assert.equal(await verifyPassword("password", malformed), false);
    }
});

test("verification codes contain six digits and have an expiration", () => {
    const before = Date.now();
    const { token, expiresAt } = createVerificationToken();
    assert.match(token, /^\d{6}$/);
    assert.ok(expiresAt.getTime() > before);
});

test("invalid verification and password reset dates cannot be used", async t => {
    t.mock.method(User, "findOne", (() => Promise.resolve({ verificationTokenExpiresAt: "invalid", resetPasswordTokenExpiresAt: "invalid", resetPasswordTokenHashed: "hash", resetPasswordCount: 0 })) as typeof User.findOne);
    await assert.rejects(verifyEmail({ email: "candidate@example.com", code: "123456" }), /Invalid or expired verification code/);
    const originalSecret = process.env.OTP_SECRET;
    process.env.OTP_SECRET = "test-secret";
    try {
        await assert.rejects(resetPassword({ email: "candidate@example.com", code: "123456", password: "password123" }), /Invalid or expired reset code/);
    } finally {
        if (originalSecret === undefined) delete process.env.OTP_SECRET;
        else process.env.OTP_SECRET = originalSecret;
    }
});
