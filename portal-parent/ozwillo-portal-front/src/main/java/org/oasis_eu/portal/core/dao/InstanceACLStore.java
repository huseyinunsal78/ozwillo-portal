package org.oasis_eu.portal.core.dao;

import org.oasis_eu.portal.core.model.ace.ACE;
import org.oasis_eu.portal.model.appsmanagement.User;

import java.util.List;

/**
 * User: schambon
 * Date: 9/16/14
 */
public interface InstanceACLStore {

	/**
	 * Lists ALL ACE (including app_admin !app_user which Kernel actually deduces from orga admins)
	 * @param instanceId
	 * @return
	 */
	List<ACE> getACL(String instanceId);

	/**
	 * Saves ACLs, for now only where app_user
	 * (since for those that are app_admin !app_user, Kernel deduces them from app orga admins)
	 * @param instanceId
	 * @param userIds
	 */
	void saveACL(String instanceId, List<User> userIds);
}
